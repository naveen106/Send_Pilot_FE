/** Formats email HTML with Prettier's HTML parser and consistent two-space indentation. */
export async function formatHtml(source: string): Promise<string> {
  // Load formatting code only when the user requests it; the editor stays lightweight on initial load.
  const [{ format }, { default: htmlPlugin }] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/html'),
  ]);
  return format(source, {
    parser: 'html',
    plugins: [htmlPlugin],
    tabWidth: 2,
    useTabs: false,
    printWidth: 100,
    singleQuote: false,
  });
}
