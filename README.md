# Siradify POS

A point-of-sale system for small shops in Kenya and Somalia. Sell, track stock, accept M-Pesa and cash, and get a sales report in your inbox every night.

Live app: https://siradify-pos.vercel.app

Built by SIRAD CODES: https://sirad-codes.vercel.app

![Siradify POS dashboard](https://sirad-codes.vercel.app/images/projects/siradify-pos.webp)

## Features

- POS screen for fast checkout in the browser
- M-Pesa STK Push and cash payments
- Products and stock management with low-stock alerts
- Orders and customer records
- Printable receipts
- Reports: total revenue, today's sales, sales for the last 7 days, and a split by payment method
- Daily sales report by email
- Role-based access: admin and cashier

## Tech stack

- Frontend: React, Vite (this repo)
- Backend: Node.js, Express, PostgreSQL ([siradify-api](https://github.com/fullstack4everyone/siradify-api))
- Email: Resend
- Hosting: Vercel (frontend), Railway (backend and database)

## Run it locally

You need Node.js 18 or newer and a running copy of siradify-api.

    git clone https://github.com/fullstack4everyone/siradify-web.git
    cd siradify-web
    npm install
    npm run dev

Set the backend API URL in a .env file before you start. Never commit .env to GitHub.

## Contact

Need a POS, a website, or custom software for your business?

- Website: https://sirad-codes.vercel.app
- Email: awsirloved2@gmail.com
- WhatsApp: +254 727 005 860
