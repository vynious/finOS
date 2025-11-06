lint:
	cargo clippy --workspace --all-targets --all-features -D clippy::unused_imports

fix:
	cargo fix --workspace --all-targets --allow-dirty
	cargo fmt

clean-all:
	cargo clean
	rm -rf target
