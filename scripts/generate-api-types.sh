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
  "reviews ReviewsService/openapi.json"
)

for entry in "${SERVICES[@]}"; do
  name="${entry%% *}"
  path="${entry#* }"
  spec="$SPECS_DIR$path"

  # Every service's OpenApiGenerationTest writes target/openapi.json; the copy at the service root
  # is what this script used to read. Nothing kept the two in step, so moving an endpoint and
  # rerunning the test regenerated a client that still had the old path -- the SPEC-DRIFT recorded
  # in LedgerService's OpenApiGenerationTest, which was worked around by hand-editing "generated"
  # files. The build output is the source of truth; the root copy is refreshed from it.
  fresh="${spec%/openapi.json}/target/openapi.json"
  if [ -s "$fresh" ]; then
    if ! cmp -s "$fresh" "$spec"; then
      echo "  refreshing $path from target/openapi.json"
      cp "$fresh" "$spec"
    fi
  fi

  if [ ! -s "$spec" ]; then
    echo "ERROR: $spec is empty or missing! Backend failed to generate schema."
    exit 1
  fi

  echo "Generating types and schemas for $name from $spec..."
  # Clear the previous output first. openapi-zod-client writes one file per tag and never removes
  # files for tags that have gone, so a deleted controller left its client behind: wallet_controller
  # outlived its spec and four screens kept calling it, and internal_user_controller did the same
  # after the admin user endpoints moved. Stale files also keep compiling, so nothing flags them.
  rm -rf "$SCHEMA_DIR/${name}"
  npx openapi-typescript "$spec" -o "$OUT_DIR/${name}.d.ts"
  npx openapi-zod-client "$spec" -o "$SCHEMA_DIR/${name}" --export-schemas --group-strategy tag-file
done

# tag-file grouping drops schemas shared between tags; restore them before anything imports these
node scripts/fix-missing-schemas.mjs

# The per-service facade zodiosClients.ts imports. openapi-zod-client does not write it, and the
# rm -rf above deletes the previous one, so without this step `npm run generate:api` leaves the app
# unable to compile: every `createXFacade` import resolves to a file that is no longer there.
# scripts/generate-facades.mjs existed for this and nothing called it.
node scripts/generate-facades.mjs

# Workaround for openapi-zod-client not exporting shared schemas
if [[ "$OSTYPE" == "darwin"* ]]; then
  find "$SCHEMA_DIR" -name '*.ts' -exec sed -i '' 's/^const /export const /g' {} +
else
  find "$SCHEMA_DIR" -name '*.ts' -exec sed -i 's/^const /export const /g' {} +
fi

echo "Done! Generated types in $OUT_DIR and schemas in $SCHEMA_DIR"
