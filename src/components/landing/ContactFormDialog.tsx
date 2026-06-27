import { useState, ReactNode } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5531988226866";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
  origem: z.string().trim().min(2, "Conte como nos encontrou").max(200),
  motivo: z.string().trim().min(3, "Conte brevemente o motivo").max(500),
});

type Props = {
  trigger: ReactNode;
};

const ContactFormDialog = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", origem: "", motivo: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    const message =
      `Olá, Aline, tudo bem?\n\n` +
      `Gostaria de saber mais sobre a consulta.\n\n` +
      `Segue formulário requerido:\n\n` +
      `▪️ Nome: ${result.data.nome}\n` +
      `▪️ Como encontrou este contato: ${result.data.origem}\n` +
      `▪️ Motivo do contato: ${result.data.motivo}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
    setForm({ nome: "", origem: "", motivo: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Antes de continuar</DialogTitle>
          <DialogDescription className="font-body text-sm leading-relaxed pt-2">
            Olá! Bem-vindo(a) ao consultório de Psicologia Clínica.
            <br />
            <br />
            🕒 Atendimento: segunda a sexta, das 08h às 18h
            <br />
            <span className="text-xs">(Não atendemos ligações)</span>
            <br />
            <br />
            📌 Psicoterapia para adolescentes (a partir de 14 anos) e adultos.
            <br />
            <br />
            Para dar andamento ao seu atendimento, preencha os campos abaixo. Eles serão enviados junto com sua mensagem no WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Seu nome completo"
              maxLength={100}
            />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="origem">Como encontrou este contato</Label>
            <Input
              id="origem"
              value={form.origem}
              onChange={(e) => setForm({ ...form, origem: e.target.value })}
              placeholder="Ex.: Instagram, indicação, Google..."
              maxLength={200}
            />
            {errors.origem && <p className="text-xs text-destructive">{errors.origem}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do contato</Label>
            <Textarea
              id="motivo"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              placeholder="Conte brevemente o motivo"
              maxLength={500}
              rows={3}
            />
            {errors.motivo && <p className="text-xs text-destructive">{errors.motivo}</p>}
          </div>

          <Button type="submit" className="w-full gap-2 rounded-full">
            <MessageCircle className="w-4 h-4" />
            Enviar pelo WhatsApp
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
