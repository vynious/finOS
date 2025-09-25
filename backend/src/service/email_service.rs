use std::collections::{HashMap, HashSet};
use base64::Engine;
use mail_parser::{MessageParser, Message, HeaderValue};
use reqwest::Client;
use regex::Regex;
use serde::{Deserialize};
use anyhow::{bail, Context, Ok, Result};
use tokio::fs;
use yup_oauth2::{ApplicationSecret, InstalledFlowAuthenticator, AccessToken};
use scraper::{Html, Selector};
use ollama_rs::{generation::completion::request::GenerationRequest, Ollama};
use super::models::*;


fn decode_base64url(s: &str) -> Result<Vec<u8>> {
    let mut s = s.replace('-', "+").replace('_', "/");
    while s.len() % 4 != 0 { s.push('='); }
    Ok(base64::engine::general_purpose::STANDARD.decode(s)?)
}



pub struct EmailService {
    client: Client,
    ollama: Ollama
}


impl EmailService {
    pub fn new() -> Self {
        EmailService { 
            client:reqwest::Client::new(),
            ollama: Ollama::default()
        }
    }

    // TODO: 
    pub async fn query_and_process_unseen(&self, queries: Vec<String>) -> Result<()> {
        // authentication
        // get all emails based on given query
        // filter to get untracked emails
        let mut emails = Vec::new();
        let mut seen_emails: HashSet<String> = HashSet::new();

        // get authenticated token
        let token = self.authenticate().await?;
        
        // derive token string once
        let token_str = match token.token() {
            Some(ts) => ts.to_string(),
            None => bail!("failed to obtain access token"),
        };

        // get email ids by queries
        println!("parsing token: {}", token_str);
        emails = self.list_all_messages(&token_str, &queries.join(" ")).await?;

        // omit out emails that are seen
        let filtered_emails: Vec<&GmailMessage> = emails
        .iter()
        .filter(|email| !seen_emails.contains(&email.id))
        .collect();

        // add into seen emails
        for email in filtered_emails {
            println!("checking email: {}", email.id);
            seen_emails.insert(email.id.to_string());
            let parsed_email_content = self.fetch_and_parse_email(&token_str, &email.id).await?;
            let receipts = self.parse_with_ollmao(&email.id, &parsed_email_content.html.unwrap(), "YouTrip").await?;
            for receipt in receipts.transactions {
                println!("{}", receipt.merchant.unwrap());
                println!("{}", receipt.currency.unwrap());
                println!("{}", receipt.amount.unwrap());
                println!("{}", receipt.id.unwrap());
            }
        }




        // TODO:
        // iterate over the new emails, retrieve its details and do additional 
        // filtering on the type of email, if its a receipt of a transaction/payment 
        // parse the details out into a Transaction struct and store into the database
        // we should also store the latest processed email, so when we poll we can poll 
        // from that timestamp onwards this acts like a checkpoint to 
        // optimise the retrieval of the emails.


        Ok(())
    }

    /// Lists all the Messages based on the given queries.
    /// Automatically runs pagination based on the returned response
    /// For Gmail API
    async fn list_all_messages(&self, token: &str, combined_queries: &str) -> Result<Vec<GmailMessage>> {
        let mut all_messages: Vec<GmailMessage> = Vec::new();
        let mut current_page_token: Option<String> = None;

        // Run pagination on the query
        loop {
                let mut req = self.client
                .get("https://gmail.googleapis.com/gmail/v1/users/me/messages")
                .bearer_auth(token)
                .query(&[("q", combined_queries)]);

            if let Some(tok) = &current_page_token {
                req = req.query(&[("pageToken", tok)]);
            }

            let resp: GmailMessagesResponse = req.send().await?.error_for_status()?.json().await?;

            if let Some(mut messages) = resp.messages {
                all_messages.append(&mut messages);
            }
            
            if let Some(tok) = resp.next_page_token {
                current_page_token = Some(tok);
                break;
            } else{ 
                break;
            }
        }
        Ok(all_messages)
    }


    /// Runs authentication based on the client_secret and returns the AccessToken
    async fn authenticate(&self) -> Result<AccessToken> {
        // load client secret  
        println!("running email authentication");
        let secret_str = fs::read_to_string("client_secret_web.json").await.context("parsing web secret")?;
        let secret: ApplicationSecret = serde_json::from_str(&secret_str).map_err(|e| {
            eprintln!("failed to parse {}", e);
            e
        })?;
        
        // create auth
        let auth = InstalledFlowAuthenticator::builder(
            secret, yup_oauth2::InstalledFlowReturnMethod::HTTPRedirect)
        .persist_tokens_to_disk("tokencache.json")
        .build()
        .await?;

        // get readonly token
        let token = auth
        .token(&["https://www.googleapis.com/auth/gmail.readonly"])
        .await?;

        Ok(token)
    }

    /// Retrieves the email based on the GmailMessage ID and extracts the content
    async fn fetch_and_parse_email(&self, token: &str, id: &str) -> Result<ParsedEmailContent> {   
        let bytes = self.fetch_email_raw(token, id).await?;
        let message = self.parse_message(&bytes);
        let extracted = self.extract_email_content(&message);
        Ok(extracted)
    }

    async fn fetch_email_raw(&self, token: &str, id: &str) -> Result<Vec<u8>> {
        let url = format!("https://gmail.googleapis.com/gmail/v1/users/me/messages/{}?format=raw", id);
        let raw_msg: RawGmailMessage = self.client.get(&url)
            .bearer_auth(token)
            .send().await?
            .error_for_status()?
            .json().await?;
        Ok(decode_base64url(&raw_msg.raw)?)
    }


    fn parse_message<'a>(&self, bytes: &'a [u8]) -> mail_parser::Message<'a> {
        MessageParser::default().parse(bytes).expect("parse email")
    }


    fn extract_email_content(&self, parsed: &Message<'_>) -> ParsedEmailContent {
        let subject = parsed.subject().map(|s| s.to_string());
        let (from_name, from_addr) = parsed.from()
            .and_then(|addrs| {addrs.first()})
            .map(|addr| (addr.name().map(|n| n.to_string()), addr.address().map(|a| a.to_string())))
            .unwrap_or((None, None));
        let text = parsed.body_text(0).map(|x|x.to_string());
        let html = parsed.body_html(0).map(|x| x.to_string());

        ParsedEmailContent {
            subject,
            from_name,
            from_addr,
            text,
            html
        }
    }
    
    fn applies(&self, rule: &CompiledRule, from: &str, subject: &str) -> bool {
        let from_ok = rule.from_contains.iter().any(|s| from.contains(s));
        let subj_ok = rule.subject_re.as_ref().map(|re| re.is_match(subject)).unwrap_or(true);
        from_ok && subj_ok
    }


    fn html_to_text(&self, html: &str) -> String {
        // 1) extract all text nodes
        let doc = scraper::Html::parse_document(html);
        let mut t = doc.root_element().text().collect::<Vec<_>>().join("\n");

        // 2) common entity/char fixes (quoted-printable should be decoded earlier in your mail layer)
        t = t.replace('\u{00a0}', " ")  // nbsp
            .replace('\u{200b}', "");  // zero-width space

        // 4) collapse runs of spaces/tabs *within a line* but keep newlines
        let re_intraline = Regex::new(r"[ \t]+").unwrap();
        t = re_intraline.replace_all(&t, " ").to_string();

        // 5) collapse excessive newlines to a single newline (table cells → many tiny lines)
        let re_newlines = Regex::new(r"\n{2,}").unwrap();
        t = re_newlines.replace_all(&t, "\n").to_string();

        // 6) trim each line and drop empties so "visual rows" become parseable lines
        let lines: Vec<String> = t
            .lines()
            .map(|l| l.trim())
            .filter(|l| !l.is_empty())
            .map(|l| l.to_string())
            .collect();

        lines.join("\n")
    }

    fn canonicalize_amount(&self, amount_raw: &str) -> String {
        let mut s = amount_raw.trim().replace(' ', "");
        let has_dot = s.contains('.');
        let has_comma = s.contains(',');
        let dec_is_comma =
            (has_dot && has_comma && s.rfind(',') > s.rfind('.')) || (!has_dot && has_comma);
        if dec_is_comma { s = s.replace('.', ""); s = s.replace(',', "."); }
        else { s = s.replace(',', ""); }
        s
    }

    /// load rules based on issuer
    async fn compile_rule(&self, issuer: &str) -> Result<CompiledRule> {
        let yaml = match issuer {
            "youtrip" => fs::read_to_string("rules/youtrip.yml").await.ok(),
            "wise" => fs::read_to_string("rules/wise.yml").await.ok(),
            "trustbank" => fs::read_to_string("rules/trustbank.yml").await.ok(),
            _ => bail!("unknown issuer: {}", issuer),
        };

        if let Some(yaml_str) = yaml {
            let rf: RuleFile = serde_yaml::from_str(&yaml_str)?;
            Ok(CompiledRule {
                id: rf.id,
                from_contains: rf.detect.from_contains,
                subject_re: rf.detect.subject_re.map(|s| Regex::new(&s)).transpose()?,
                patterns: rf.extract.patterns.into_iter().map(|p| Regex::new(&p)).collect::<Result<_, _>>()?,
                norm: rf.normalize,
            })
        } else {
            bail!("rule file not found for issuer: {}", issuer);
        }

    }
        
    fn map_currency(&self, cur: &str, allow_symbol: bool) -> Option<String> {
        let c = cur.trim();
        if c.len() == 3 { return Some(c.to_uppercase()); }
        if !allow_symbol { return None; }
        Some(match c {
            "€" => "EUR", "$" => "USD", "£" => "GBP", "¥" => "JPY", "S$" => "SGD", _ => "UNKNOWN"
        }.to_string())
    }

    async fn parse_with_ollmao(&self, id: &str, raw: &str, issuer: &str) -> Result<ReceiptList>{
        println!("trying to parse with ollama");
        let text = self.html_to_text(raw);
        let model = "llama3.1:latest".to_string();
        let prompt = format!("Issuer is {}. Identify the transactions in this text \n {} \n and Return ONLY valid JSON for the schema: {{ 'transactions': [ {{ 'id': '...', 'merchant': '...', 'amount': 0.0, 'currency': '...', 'issuer': '...' }} ] }}",issuer, text);
        let res = self.ollama
            .generate(GenerationRequest::new(model, prompt)
            .format(ollama_rs::generation::parameters::FormatType::Json))
            .await?;
        println!("ollama response: {}", res.response);
        let val: ReceiptList = serde_json::from_str(&res.response)?;
        Ok(val)
    }

}
        
        
    

#[cfg(test)]
mod tests {
    use super::*;
    use crate::service::models::{CompiledRule, Normalize};
    use regex::Regex;

    fn svc() -> EmailService { EmailService::new() }

    #[test]
    fn canonicalize_amount_handles_commas_and_dots() {
        let s = svc();
        assert_eq!(s.canonicalize_amount("1,234.56"), "1234.56");
        assert_eq!(s.canonicalize_amount("1.234,56"), "1234.56");
        assert_eq!(s.canonicalize_amount("  12 345  "), "12345");
    }

    #[test]
    fn map_currency_from_code_and_symbol() {
        let s = svc();
        assert_eq!(s.map_currency("sgd", true).as_deref(), Some("SGD"));
        assert_eq!(s.map_currency("S$", true).as_deref(), Some("SGD"));
        assert_eq!(s.map_currency("$", false), None);
    }

    #[test]
    // fn parse_with_rule_extracts_receipt() {
    //     let s = svc();
    //     let rule = CompiledRule {
    //         id: "youtrip".to_string(),
    //         from_contains: vec!["noreply@youtrip.com".to_string()],
    //         subject_re: None,
    //         patterns: vec![
    //             Regex::new(r"(?i)paid\s+(?P<currency>sgd|\$)\s*(?P<amount>\d+(?:[.,]\d{2})?)\s+at\s+(?P<merchant>.+)$").unwrap()
    //         ],
    //         norm: Normalize { currency_from_symbol: true, decimal_heuristics: None, tz: None },
    //     };
    //     let out = s.parse_with_rule(
    //         "msg-1",
    //         &rule,
    //         "youtrip",
    //         "Paid SGD 12.34 at Coffee Bean"
    //     );
    //     assert_eq!(out.len(), 1);
    //     assert_eq!(out[0].merchant, "Coffee Bean");
    //     assert_eq!(out[0].currency, "SGD");
    //     assert_eq!(out[0].amount, "12.34");
    // }

    #[test]
    fn applies_checks_from_and_subject() {
        let s = svc();
        let rule = CompiledRule {
            id: "x".to_string(),
            from_contains: vec!["bank.com".to_string()],
            subject_re: Some(Regex::new(r"(?i)receipt").unwrap()),
            patterns: vec![],
            norm: Normalize { currency_from_symbol: true, decimal_heuristics: None, tz: None },
        };
        assert!(s.applies(&rule, "no-reply@bank.com", "Your receipt is ready"));
        assert!(!s.applies(&rule, "no-reply@shop.com", "Your receipt is ready"));
        assert!(!s.applies(&rule, "no-reply@bank.com", "Statement"));
    }
}