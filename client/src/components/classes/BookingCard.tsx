import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import { type BookingResponse } from "@shared/routes";
import { useDeleteBooking } from "@/hooks/use-bookings";
import { useToast } from "@/hooks/use-toast";

interface BookingCardProps {
  booking: BookingResponse;
}

export function BookingCard({ booking }: BookingCardProps) {
  const { mutate: cancelBooking, isPending } = useDeleteBooking();
  const { toast } = useToast();
  
  const startDate = new Date(booking.class.startTime);
  const endDate = new Date(booking.class.endTime);
  const isPast = endDate < new Date();

  const handleCancel = () => {
    if (confirm("Möchtest du diese Buchung wirklich stornieren?")) {
      cancelBooking(booking.id, {
        onSuccess: () => {
          toast({
            title: "Storniert",
            description: "Deine Buchung wurde erfolgreich storniert.",
          });
        },
        onError: (err) => {
          toast({
            title: "Fehler",
            description: "Stornierung fehlgeschlagen: " + err.message,
            variant: "destructive",
          });
        }
      });
    }
  };

  return (
    <div className={`glass-panel rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center transition-all ${isPast ? 'opacity-60 grayscale-[0.5]' : 'hover:border-white/10 hover:bg-card/80'}`}>
      
      <div className="flex-1 w-full">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-display font-bold text-foreground">
            {booking.class.title}
          </h3>
          {isPast && (
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-muted-foreground border border-white/5">
              Vergangen
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
          mit {booking.class.instructor}
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-foreground/80">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{format(startDate, "dd. MMM yyyy", { locale: de })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>{format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}</span>
          </div>
        </div>
      </div>

      {!isPast && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-medium text-sm border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive text-destructive hover:text-destructive-foreground hover:shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
        >
          <X className="w-4 h-4" />
          {isPending ? "Wird storniert..." : "Stornieren"}
        </button>
      )}
    </div>
  );
}
