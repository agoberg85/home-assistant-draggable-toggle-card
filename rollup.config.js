import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/mysmart-draggable-toggle.js',
    output: {
        file: 'mysmart-draggable-toggle.js',
        format: 'es',
        sourcemap: true,
    },
    plugins: [
        nodeResolve(),
        terser({
            format: {
                comments: false,
            },
        }),
    ],
};
