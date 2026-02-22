import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar, Clock, Users, User, CheckCircle2 } from "lucide-react";
import { type ClassResponse } from "@shared/routes";
import { useCreateBooking } from "@/hooks/use-bookings";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ClassCardProps {
  gymClass: ClassResponse;
  isBooked?: boolean;
}

export function ClassCard({ gymClass, isBooked = false }: ClassCardProps) {
  const { mutate: bookClass, isPending } = useCreateBooking();
  const { toast } = useToast();
  
  const availableSpots = Math.max(0, gymClass.capacity - gymClass.bookingsCount);
  const isFull = availableSpots === 0;
  const startDate = new Date(gymClass.startTime);
  const endDate = new Date(gymClass.endTime);

  const handleBook = () => {
    bookClass(gymClass.id, {
      onSuccess: () => {
        toast({
          title: "Erfolgreich gebucht!",
          description: `Du bist für ${gymClass.title} angemeldet.`,
        });
      },
      onError: (err) => {
        toast({
          title: "Fehler",
          description: err.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className={cn(
      "glass-panel rounded-2xl p-6 flex flex-col h-full transition-all duration-300 relative overflow-hidden group",
      isBooked ? "border-primary/30 shadow-[0_0_15px_rgba(204,255,0,0.05)]" : "hover:-translate-y-1 hover:border-white/10 hover:bg-card/80"
    )}>
      {/* Decorative gradient blob */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="text-xl font-display font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
            {gymClass.title}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{gymClass.instructor}</span>
          </div>
        </div>
        {isBooked ? (
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-primary/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Gebucht
          </div>
        ) : isFull ? (
          <div className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-xs font-semibold border border-destructive/20">
            Ausgebucht
          </div>
        ) : (
          <div className="bg-white/5 text-muted-foreground px-3 py-1 rounded-full text-xs border border-white/10">
            {availableSpots} Plätze frei
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-6 flex-1 relative z-10">
        {gymClass.description}
      </p>

      <div className="space-y-2 mb-6 relative z-10">
        <div className="flex items-center gap-3 text-sm text-foreground/80 bg-white/5 px-3 py-2 rounded-lg">
          <Calendar className="w-4 h-4 text-primary" />
          <span>{format(startDate, "EEEE, dd. MMMM yyyy", { locale: de })}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-foreground/80 bg-white/5 px-3 py-2 rounded-lg">
          <Clock className="w-4 h-4 text-primary" />
          <span>{format(startDate, "HH:mm", { locale: de })} - {format(endDate, "HH:mm", { locale: de })} Uhr</span>
        </div>
      </div>

      <button
        onClick={handleBook}
        disabled={isBooked || isFull || isPending}
        className={cn(
          "w-full py-3 px-4 rounded-xl font-display font-semibold transition-all duration-200 flex items-center justify-center gap-2 relative z-10",
          isBooked 
            ? "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5" 
            : isFull
              ? "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:scale-[1.02] active:scale-[0.98]"
        )}
      >
        {isPending ? "Lädt..." : isBooked ? "Bereits gebucht" : isFull ? "Warteliste (Voll)" : "Jetzt Buchen"}
      </button>
    </div>
  );
}
