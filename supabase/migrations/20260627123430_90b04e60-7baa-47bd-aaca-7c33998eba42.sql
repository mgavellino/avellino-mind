CREATE TABLE IF NOT EXISTS public.depoimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  estrelas INTEGER NOT NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.depoimentos TO anon;
GRANT SELECT, INSERT ON public.depoimentos TO authenticated;
GRANT ALL ON public.depoimentos TO service_role;

ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Depoimentos públicos para leitura" ON public.depoimentos;
CREATE POLICY "Depoimentos públicos para leitura"
ON public.depoimentos FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Qualquer pessoa pode publicar depoimento" ON public.depoimentos;
CREATE POLICY "Qualquer pessoa pode publicar depoimento"
ON public.depoimentos FOR INSERT
WITH CHECK (
  char_length(nome) BETWEEN 2 AND 60
  AND estrelas BETWEEN 1 AND 5
  AND char_length(comentario) BETWEEN 10 AND 500
);

CREATE INDEX IF NOT EXISTS idx_depoimentos_created_at ON public.depoimentos(created_at DESC);