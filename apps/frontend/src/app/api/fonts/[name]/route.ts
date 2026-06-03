import { GOOGLE_FONTS_DATABASE } from '@/app/[locale]/projects/[project-id]/_editor-container/editor/data/google-fonts';

export const GET = async (_request: Request, { params }: { params: Promise<{ name: string }> }) => {
  const { name } = await params;
  const entry = GOOGLE_FONTS_DATABASE.find((font) => font.fontFamily === name);

  if (!entry) {
    return new Response('Font not found', { status: 404 });
  }

  return Response.json(entry, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
