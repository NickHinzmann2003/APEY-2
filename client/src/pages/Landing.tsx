import { Link } from "wouter";
import { Dumbbell, ArrowRight, Activity, CalendarCheck, Trophy } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground overflow-hidden selection:bg-primary selection:text-black">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full z-50 p-6 md:p-8 flex justify-between items-center">
        <div className="flex items-center gap-2 text-primary">
          <Dumbbell className="h-8 w-8" />
          <span className="font-display font-bold text-2xl tracking-wider uppercase text-white">
            APEX <span className="text-primary">by Nick</span>
          </span>
        </div>
        <a 
          href="/api/login"
          className="px-6 py-2.5 rounded-full text-sm font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          Login
        </a>
      </nav>

      {/* Split Screen Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Left Side: Imagery & Mood */}
        <div className="relative lg:w-1/2 min-h-[50vh] lg:min-h-screen flex items-end p-8 lg:p-16">
          {/* Unsplash image: dark modern gym equipment */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop"
              alt="Modern dark fitness studio" 
              className="w-full h-full object-cover"
            />
            {/* Dark gradient wash to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20 lg:bg-gradient-to-r lg:from-transparent lg:to-background" />
          </div>
          
          <div className="relative z-10 w-full max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium mb-6 backdrop-blur-sm">
              <Activity className="w-4 h-4" />
              <span>Studio der nächsten Generation</span>
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-bold leading-[1.1] mb-6 text-glow">
              Trainiere auf <br/>
              <span className="text-primary">deinem Niveau.</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              Erlebe erstklassige Kurse, professionelle Trainer und eine Community, die dich zu Bestleistungen antreibt.
            </p>
          </div>
        </div>

        {/* Right Side: Action & Features */}
        <div className="lg:w-1/2 flex flex-col justify-center p-8 lg:p-24 relative bg-background">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-md mx-auto w-full">
            <h2 className="font-display text-3xl font-bold mb-2">Bereit anzufangen?</h2>
            <p className="text-muted-foreground mb-10">Melde dich an, um unsere exklusiven Kurse zu durchstöbern und deinen Platz zu sichern.</p>

            <a 
              href="/api/login"
              className="group flex items-center justify-between w-full p-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-lg hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(204,255,0,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Jetzt Anmelden</span>
              <div className="bg-black/10 p-2 rounded-xl group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-5 h-5" />
              </div>
            </a>

            <div className="mt-16 space-y-6">
              <div className="flex gap-4 items-start p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="bg-primary/10 p-3 rounded-xl text-primary">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Einfache Buchung</h3>
                  <p className="text-sm text-muted-foreground">Sichere dir deinen Platz in Sekunden. Volle Kontrolle über deinen Trainingsplan.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="bg-primary/10 p-3 rounded-xl text-primary">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Premium Kurse</h3>
                  <p className="text-sm text-muted-foreground">Von HIIT bis Yoga. Professionell angeleitete Sessions für jedes Ziel.</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
