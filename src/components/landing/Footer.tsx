import logo from "@/assets/landing/logo-aline.jpeg";

const Footer = () => (
  <footer className="py-10 bg-background border-t border-border">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo Aline Dias" className="w-12 h-12 rounded-full object-cover" />
          <div>
            <p className="font-heading text-lg font-medium text-foreground">Aline Dias</p>
            <p className="text-muted-foreground font-body text-xs tracking-widest uppercase mt-0.5">Psicóloga</p>
          </div>
        </div>
        <p className="text-muted-foreground/60 font-body text-xs">
          © {new Date().getFullYear()} Aline Dias — Todos os direitos reservados.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
