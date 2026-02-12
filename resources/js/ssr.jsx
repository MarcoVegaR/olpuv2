/* prettier-ignore */
import {
createInertiaApp
} from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';
import { route as routeFn } from '../../vendor/tightenco/ziggy/dist/index.esm.js';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        resolve: (name) => {
            const pages = import.meta.glob('./pages/**/*.tsx', {
                eager: true,
            });
            return pages[`./pages/${name}.tsx`];
        },
        setup: ({ App, props }) => {
            // Make Ziggy's route() available globally during SSR
            const ziggy = page.props.ziggy;
            if (ziggy) {
                globalThis.route = (name, params, absolute, config) =>
                    routeFn(name, params, absolute, {
                        ...ziggy,
                        location: new URL(ziggy.url),
                        ...config,
                    });
            }

            return <App {...props} />;
        },
    }),
);
