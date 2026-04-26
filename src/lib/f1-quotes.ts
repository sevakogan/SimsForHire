/**
 * F1 driver quotes for the waiver-sign success screen.
 * Selection is deterministic per signer name (so the same person sees the
 * same quote on a refresh) but spreads across the pool to minimize
 * repetition between different signers.
 */

export interface F1Quote {
  text: string;
  driver: string;
}

export const F1_QUOTES: readonly F1Quote[] = [
  { text: "If you no longer go for a gap that exists, you are no longer a racing driver.", driver: "Ayrton Senna" },
  { text: "I am not designed to come second or third. I am designed to win.", driver: "Ayrton Senna" },
  { text: "Winning is not everything, but wanting to win is.", driver: "Vince Lombardi (via Senna)" },
  { text: "I have been racing all my life. Pretty much from the moment I was born.", driver: "Lewis Hamilton" },
  { text: "Anything is possible. You just need to put your mind to it.", driver: "Lewis Hamilton" },
  { text: "Once something is a passion, the motivation is there.", driver: "Michael Schumacher" },
  { text: "I always give 100 percent — sometimes more.", driver: "Michael Schumacher" },
  { text: "Straight lines are for fast cars, curves are for fast drivers.", driver: "Mario Andretti" },
  { text: "If everything seems under control, you're not going fast enough.", driver: "Mario Andretti" },
  { text: "To achieve anything in this game, you must be prepared to dabble in the boundary of disaster.", driver: "Stirling Moss" },
  { text: "Smooth is fast.", driver: "Jackie Stewart" },
  { text: "I love racing because it makes me feel alive.", driver: "Charles Leclerc" },
  { text: "Pressure is a privilege.", driver: "Lando Norris" },
  { text: "I never lose. I either win or learn.", driver: "Nelson Mandela (via F1 paddock)" },
  { text: "It's not enough to want it — you have to be ready to suffer for it.", driver: "Fernando Alonso" },
  { text: "I am not designed to settle. I am designed to push.", driver: "Max Verstappen" },
  { text: "On the limit, every lap.", driver: "Max Verstappen" },
  { text: "There's no time to think — you just react. That's racing.", driver: "Sebastian Vettel" },
  { text: "Aerodynamics are for people who can't build engines.", driver: "Enzo Ferrari" },
  { text: "Race cars are neither beautiful nor ugly. They become beautiful when they win.", driver: "Enzo Ferrari" },
  { text: "I'm an artist. The track is my canvas, and the car is my brush.", driver: "Graham Hill" },
  { text: "When you're racing, it's life. Anything that happens before or after is just waiting.", driver: "Steve McQueen" },
  { text: "Going fast is easy. Going fast for a long time is the hard part.", driver: "Niki Lauda" },
] as const;

/**
 * Pick a stable quote for a given signer name. Uses a tiny string hash so
 * the same name always lands on the same quote.
 */
export function pickF1Quote(name: string): F1Quote {
  const seed = name.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return F1_QUOTES[hash % F1_QUOTES.length];
}
