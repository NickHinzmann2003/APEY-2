import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { ClassCard } from "@/components/classes/ClassCard";
import { BookingCard } from "@/components/classes/BookingCard";
import { useClasses } from "@/hooks/use-classes";
import { useBookings } from "@/hooks/use-bookings";
import { Loader2, Dumbbell, CalendarX2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<"classes" | "bookings">("classes");
  
  const { data: classes, isLoading: isLoadingClasses, error: classesError } = useClasses();
  const { data: bookings, isLoading: isLoadingBookings, error: bookingsError } = useBookings();

  const isLoading = isLoadingClasses || isLoadingBookings;
  const error = classesError || bookingsError;

  // Derive which classes are booked by the user
  const bookedClassIds = new Set(bookings?.map(b => b.classId) || []);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-primary">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="text-muted-foreground font-display tracking-widest uppercase text-sm">Lade Daten...</p>
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="glass-panel p-8 rounded-2xl text-center max-w-md mx-auto mt-12">
          <p className="text-destructive font-semibold mb-2">Ein Fehler ist aufgetreten</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </Shell>
    );
  }

  // Filter out classes that are in the past for the main schedule
  const upcomingClasses = classes?.filter(c => new Date(c.endTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];

  return (
    <Shell>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-bold mb-2">Dein Training</h1>
          <p className="text-muted-foreground">Verwalte deine Kurse und behalte deine Ziele im Blick.</p>
        </div>
        
        {/* Custom Tab Switcher */}
        <div className="flex bg-card border border-white/5 p-1.5 rounded-2xl self-start md:self-auto shadow-lg">
          <button
            onClick={() => setActiveTab("classes")}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
              activeTab === "classes" 
                ? "bg-white/10 text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            Verfügbare Kurse
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2",
              activeTab === "bookings" 
                ? "bg-white/10 text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            Meine Buchungen
            {bookings && bookings.length > 0 && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === "bookings" ? "bg-primary text-primary-foreground" : "bg-white/10 text-muted-foreground"
              )}>
                {bookings.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "classes" && (
          <>
            {upcomingClasses.length === 0 ? (
              <div className="text-center py-24 glass-panel rounded-3xl border-dashed">
                <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-display font-semibold mb-2">Keine Kurse verfügbar</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Aktuell sind keine neuen Kurse geplant. Schau später nochmal vorbei!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingClasses.map((gymClass) => (
                  <ClassCard 
                    key={gymClass.id} 
                    gymClass={gymClass} 
                    isBooked={bookedClassIds.has(gymClass.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "bookings" && (
          <div className="max-w-4xl mx-auto space-y-4">
            {!bookings || bookings.length === 0 ? (
              <div className="text-center py-24 glass-panel rounded-3xl border-dashed">
                <CalendarX2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-display font-semibold mb-2">Noch keine Buchungen</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Du hast noch keine Kurse gebucht. Wechsle zum Tab "Verfügbare Kurse", um zu starten.</p>
                <button 
                  onClick={() => setActiveTab("classes")}
                  className="mt-6 text-primary hover:underline font-semibold"
                >
                  Kurse ansehen &rarr;
                </button>
              </div>
            ) : (
              bookings
                .sort((a, b) => new Date(b.class.startTime).getTime() - new Date(a.class.startTime).getTime())
                .map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
