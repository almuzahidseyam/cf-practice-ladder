import ts from 'typescript-eslint';
export default [
  {ignores:['.next/**','node_modules/**','next-env.d.ts']},
  ...ts.configs.recommended.map(config=>({...config,files:['src/**/*.ts','src/**/*.tsx']})),
];
