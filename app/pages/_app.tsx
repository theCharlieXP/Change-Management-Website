import { AppProps } from 'next/app';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
    const router = useRouter();

    // Ensure the router is ready before rendering the page
    if (!router.isReady) {
        return <div>Loading...</div>;
    }

    return <Component {...pageProps} />;
}

export default MyApp; 