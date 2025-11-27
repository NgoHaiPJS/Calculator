Calculator Web App

- Open `index.html` in a browser to run the calculator.
- The app uses a simulated payment modal. No real payments.

Plans:
- Basic — $6.70 — 1 calculation — allows + and - only
- Advanced — $18 — 3 calculations — allows +, -, ×
- Professional — $36 — 5 calculations — allows +, -, ×, ÷

Behavior:
- Attempting to compute without a plan opens the pricing modal.
- Choosing a plan shows "Processing..." for 3 seconds, then "Payment completed".
- After payment the pending calculation is executed and the plan's credits decrement.
- Plan state is saved to `localStorage` so refresh will keep credits.

Files:
- `index.html` — UI
- `styles.css` — styles
- `script.js` — logic and payment simulation

To test quickly (Windows PowerShell):

```powershell
# from the project folder
Start-Process index.html
```
