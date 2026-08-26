import { z } from "zod";
try {
  z.string().datetime({ offset: true }).parse("2026-08-26T09:12:27.675084642Z");
  console.log("SUCCESS");
} catch (e: any) {
  console.log("ERROR", JSON.stringify(e.issues));
}
