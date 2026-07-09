import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  const code = fs.readFileSync('src/components/CustomerDashboard.tsx', 'utf-8');
  console.log("Refactoring CustomerDashboard...");
  
  const prompt = `
I have a large React component called CustomerDashboard.tsx. It is 1800 lines long.
I want to extract the following parts into separate files:
1. CartDrawer.tsx (Lines containing {/* ------------------- CART DRAWER ------------------- */})
2. AccountModal.tsx (Lines containing {/* ------------------- ACCOUNT MODAL ------------------- */})
3. AddressModal.tsx (Lines containing {/* ------------------- ADDRESS MODAL ------------------- */})
4. PaymentModal.tsx (Lines containing {/* ------------------- PAYMENT MODAL ------------------- */})

I want you to write a Node script that uses regular expressions or simple string splitting to extract these 4 modals out of CustomerDashboard.tsx. Then generate the new files for each, adding necessary imports and declaring interfaces for their props. Finally, update CustomerDashboard.tsx to import and use these 4 components, passing the required props.

Actually, skip generating the script. Just return the EXACT, FULL contents of the 5 files in this format:

==== FILE: src/components/CartDrawer.tsx ====
[file contents here]
==== FILE: src/components/AccountModal.tsx ====
[file contents here]
==== FILE: src/components/AddressModal.tsx ====
[file contents here]
==== FILE: src/components/PaymentModal.tsx ====
[file contents here]
==== FILE: src/components/CustomerDashboard.tsx ====
[file contents here]

Make sure ALL code is complete, no truncated sections. This is very important. DO NOT TRUNCATE.
`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [prompt, code]
    });
    
    fs.writeFileSync('refactor_output.txt', response.text);
    console.log("Done refactoring. Output saved to refactor_output.txt");
  } catch (e) {
    console.error(e);
  }
}

run();
