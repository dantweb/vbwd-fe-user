.PHONY: up down up-build rebuild-backend rebuild-admin rebuild-user logs ps clean npm-install

# Start all containers (backend + frontend)
up:
	docker compose up dev -d --build
