import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, BookOpen, Plus, Trash2, Star, ExternalLink, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/app/livros")({
  component: BooksPage,
});

type OLDoc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  ia?: string[];
  has_fulltext?: boolean;
  ebook_access?: string;
  lending_identifier_s?: string;
  isbn?: string[];
};

type Book = {
  id: string;
  ol_key: string | null;
  title: string;
  authors: string | null;
  cover_id: number | null;
  first_publish_year: number | null;
  status: "want" | "reading" | "read";
  rating: number | null;
  notes: string | null;
};

const STATUS_LABEL: Record<Book["status"], string> = {
  want: "Quero ler",
  reading: "Lendo",
  read: "Lido",
};

const coverUrl = (id?: number | null, size: "S" | "M" | "L" = "M") =>
  id ? `https://covers.openlibrary.org/b/id/${id}-${size}.jpg` : null;

type Reader = {
  title: string;
  iaId?: string;
  olKey?: string;
  isbn?: string;
};

function BooksPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"search" | "shelf">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OLDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [shelf, setShelf] = useState<Book[]>([]);
  const [filter, setFilter] = useState<Book["status"] | "all">("all");
  const [reader, setReader] = useState<Reader | null>(null);
  const [resolvingIa, setResolvingIa] = useState<string | null>(null);

  const loadShelf = async () => {
    const { data } = await supabase
      .from("books" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setShelf((data ?? []) as unknown as Book[]);
  };

  useEffect(() => {
    if (user) loadShelf();
  }, [user]);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=40&fields=key,title,author_name,cover_i,first_publish_year,ia,has_fulltext,ebook_access,lending_identifier_s,isbn`,
      );
      const j = await r.json();
      setResults(j.docs ?? []);
    } catch {
      toast.error("Falha ao buscar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const addToShelf = async (doc: OLDoc, status: Book["status"]) => {
    if (!user) return;
    const { error } = await supabase.from("books" as any).insert({
      owner_id: user.id,
      ol_key: doc.key,
      title: doc.title,
      authors: doc.author_name?.join(", ") ?? null,
      cover_id: doc.cover_i ?? null,
      first_publish_year: doc.first_publish_year ?? null,
      status,
    });
    if (error) return toast.error("Erro ao salvar");
    toast.success(`Adicionado em "${STATUS_LABEL[status]}"`);
    loadShelf();
  };

  const updateBook = async (id: string, patch: Partial<Book>) => {
    await supabase.from("books" as any).update(patch).eq("id", id);
    loadShelf();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover livro?")) return;
    await supabase.from("books" as any).delete().eq("id", id);
    loadShelf();
  };

  /** Tenta achar um ID do Internet Archive para o livro, usando vários caminhos. */
  const openReader = async (opts: {
    title: string;
    olKey?: string | null;
    ia?: string[];
    lending?: string | null;
    isbn?: string[];
  }) => {
    const directIa = opts.ia?.[0] ?? opts.lending ?? null;
    if (directIa) {
      setReader({ title: opts.title, iaId: directIa, olKey: opts.olKey ?? undefined });
      return;
    }
    setResolvingIa(opts.olKey ?? opts.title);
    try {
      // 1) Open Library work/edition → ocaid
      if (opts.olKey) {
        try {
          const r = await fetch(`https://openlibrary.org${opts.olKey}.json`);
          const j = await r.json();
          if (j.ocaid) {
            setReader({ title: opts.title, iaId: j.ocaid, olKey: opts.olKey });
            return;
          }
        } catch {}
      }
      // 2) Busca no Internet Archive por título
      try {
        const q = `title:(${opts.title}) AND mediatype:texts`;
        const r = await fetch(
          `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&rows=1&output=json`,
        );
        const j = await r.json();
        const id = j?.response?.docs?.[0]?.identifier;
        if (id) {
          setReader({ title: opts.title, iaId: id, olKey: opts.olKey ?? undefined });
          return;
        }
      } catch {}
      // 3) Sem leitura integral — abre visualizador do Google Books
      setReader({
        title: opts.title,
        olKey: opts.olKey ?? undefined,
        isbn: opts.isbn?.[0],
      });
    } finally {
      setResolvingIa(null);
    }
  };

  const filtered = useMemo(
    () => (filter === "all" ? shelf : shelf.filter((b) => b.status === filter)),
    [shelf, filter],
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Livros</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Busque qualquer título no acervo mundial (Open Library + Internet Archive) e leia
          dentro do site quando houver versão integral disponível.
        </p>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-surface/40 rounded-lg w-fit">
        {(["search", "shelf"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 h-9 rounded-md text-sm transition-colors ${
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "search" ? "Buscar" : `Minha estante (${shelf.length})`}
          </button>
        ))}
      </div>

      {tab === "search" ? (
        <>
          <form onSubmit={search} className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Título, autor, ISBN..."
                className="w-full h-11 pl-10 pr-3 rounded-lg bg-background border border-border/60 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-11 px-5 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </button>
          </form>

          {results.length === 0 && !loading && (
            <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Digite um título, autor ou ISBN. Ex.: "1984", "Clarice Lispector", "TCC"...
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((d) => {
              const cover = coverUrl(d.cover_i, "M");
              const directReadable =
                !!d.ia?.length ||
                !!d.lending_identifier_s ||
                d.ebook_access === "public" ||
                d.ebook_access === "borrowable";
              const busy = resolvingIa === (d.key ?? d.title);
              return (
                <div key={d.key} className="rounded-2xl border border-border/60 bg-surface/40 p-3 flex gap-3">
                  <div className="w-20 h-28 shrink-0 rounded-md bg-surface overflow-hidden grid place-items-center">
                    {cover ? (
                      <img src={cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium leading-tight line-clamp-2">{d.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {d.author_name?.join(", ") ?? "—"}
                    </div>
                    {d.first_publish_year && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{d.first_publish_year}</div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <button
                        onClick={() =>
                          openReader({
                            title: d.title,
                            olKey: d.key,
                            ia: d.ia,
                            lending: d.lending_identifier_s,
                            isbn: d.isbn,
                          })
                        }
                        disabled={busy}
                        className={`h-7 px-2 rounded-md text-[11px] inline-flex items-center gap-1 ${
                          directReadable
                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border border-border/60 hover:bg-surface"
                        }`}
                      >
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookOpen className="h-3 w-3" />}
                        Ler
                      </button>
                      <button
                        onClick={() => addToShelf(d, "want")}
                        className="h-7 px-2 rounded-md text-[11px] border border-border/60 hover:bg-surface inline-flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Quero ler
                      </button>
                      <button
                        onClick={() => addToShelf(d, "reading")}
                        className="h-7 px-2 rounded-md text-[11px] bg-brand/10 text-brand border border-brand/30"
                      >
                        Lendo
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-1 mb-4">
            {(["all", "want", "reading", "read"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`h-8 px-3 rounded-md text-xs border ${
                  filter === s
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "Todos" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Estante vazia. Vá em Buscar e adicione livros.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((b) => {
                const cover = coverUrl(b.cover_id, "M");
                return (
                  <div key={b.id} className="rounded-2xl border border-border/60 bg-surface/40 p-3 flex gap-3">
                    <div className="w-20 h-28 shrink-0 rounded-md bg-surface overflow-hidden grid place-items-center">
                      {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-tight line-clamp-2">{b.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {b.authors ?? "—"}
                          </div>
                        </div>
                        <button
                          onClick={() => remove(b.id)}
                          className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <select
                        value={b.status}
                        onChange={(e) => updateBook(b.id, { status: e.target.value as Book["status"] })}
                        className="mt-2 w-full h-7 px-2 rounded-md text-[11px] bg-background border border-border/60"
                      >
                        <option value="want">Quero ler</option>
                        <option value="reading">Lendo</option>
                        <option value="read">Lido</option>
                      </select>
                      <div className="mt-1.5 flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => updateBook(b.id, { rating: b.rating === n ? null : n })}
                            className="p-0.5"
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${
                                (b.rating ?? 0) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() =>
                          openReader({ title: b.title, olKey: b.ol_key, ia: undefined, lending: null })
                        }
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-brand hover:underline"
                      >
                        <BookOpen className="h-3 w-3" /> Ler
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {reader && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between gap-3 p-3 border-b border-border/40 bg-background/95">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{reader.title}</div>
              <div className="text-[10px] text-muted-foreground">
                {reader.iaId
                  ? "Internet Archive"
                  : reader.isbn
                    ? "Pré-visualização do Google Books"
                    : "Sem leitura integral disponível"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {reader.iaId && (
                <a
                  href={`https://archive.org/details/${reader.iaId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 px-2 rounded-md text-xs border border-border/60 inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> Abrir
                </a>
              )}
              <button
                onClick={() => setReader(null)}
                className="h-8 w-8 grid place-items-center rounded-md border border-border/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black">
            {reader.iaId ? (
              <iframe
                title={reader.title}
                src={`https://archive.org/stream/${reader.iaId}?ui=embed#mode/2up`}
                className="w-full h-full border-0"
                allow="fullscreen"
              />
            ) : reader.isbn ? (
              <iframe
                title={reader.title}
                src={`https://books.google.com/books?vid=ISBN${reader.isbn}&printsec=frontcover&output=embed`}
                className="w-full h-full border-0"
              />
            ) : (
              <div className="h-full grid place-items-center text-center text-sm text-muted-foreground p-6">
                <div>
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  Este título não tem leitura integral pública disponível.<br />
                  {reader.olKey && (
                    <a
                      href={`https://openlibrary.org${reader.olKey}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline inline-flex items-center gap-1 mt-2"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver detalhes na Open Library
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
