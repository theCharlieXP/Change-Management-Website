This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Project Configuration

This project is configured to use the App Router (app directory), while maintaining compatibility with some Pages Router features for backward compatibility. The key configuration files are:

- `next.config.js` - Contains the Next.js configuration
- `pages/_document.js` and `pages/_app.js` - Special Next.js files for the Pages Router
- `app/` directory - Contains the App Router components and routes

### Common Issues and Fixes

#### _document.js Error

If you encounter an error like `Cannot find module for page: /_document`, ensure that:

1. `_document.js` exists ONLY in the `pages/` directory, not in the root directory
2. `_app.js` exists ONLY in the `pages/` directory, not in the root directory
3. Clear the `.next` directory with `rm -rf .next` before rebuilding
4. Make sure `next.config.js` doesn't contain unrecognized options like `strictMode` or `disableStaticImages`

The build process includes `next-build-fix.js` which helps resolve some common build issues.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
