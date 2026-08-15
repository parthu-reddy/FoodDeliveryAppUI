#!/bin/bash
# Generate TypeScript types and Zod schemas from all relevant OpenAPI specs
SPECS_DIR="../"  # Relative path to project root from FoodDeliveryAppUI/
OUT_DIR="src/api/generated"
SCHEMA_DIR="src/api/generated/schemas"

mkdir -p "$OUT_DIR"
mkdir -p "$SCHEMA_DIR"

SERVICES=(
  "customer CustomerApplication/openapi.json"
  "restaurant RestaurantApplication/openapi.json"
  "delivery DeliveryExecutiveApplication/openapi.json"
  "identity IdentityService/openapi.json"
  "wallet WalletService/openapi.json"
  "payment PaymentGatewayIntegration/openapi.json"
  "maps MapsIntegration/openapi.json"
  "chat CommunicationService/openapi.json"
  "campaign CampaignService/openapi.json"
  "governmentId GovernmentIDValidationService/openapi.json"
  "ledger LedgerService/openapi.json"
  "tracking UserTrackingService/openapi.json"
)

for entry in "${SERVICES[@]}"; do
  name="${entry%% *}"
  path="${entry#* }"
  spec="$SPECS_DIR$path"
  echo "Generating types and schemas for $name from $spec..."
  npx openapi-typescript "$spec" -o "$OUT_DIR/${name}.d.ts"
  npx openapi-zod-client "$spec" -o "$SCHEMA_DIR/${name}.ts" --export-schemas
done

echo "Done! Generated types in $OUT_DIR and schemas in $SCHEMA_DIR"
