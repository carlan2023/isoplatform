// ---------------------------------------------------------------------------
// Seat capacity rules.
//
// The ATOMIC enforcement lives in db/enrollment-flow.sql
// (reserve_seat_for_payment, which locks the course row). These pure helpers
// state the same rule in one place so it can be unit-tested and reasoned about.
// "Held" = enrollments with status 'awaiting_confirmation' or 'confirmed' (a
// bare 'pending' enrollment holds no seat until payment is initiated).
// ---------------------------------------------------------------------------

/** A seat can be reserved only while held seats are below the total. */
export function canReserveSeat(heldSeats: number, totalSeats: number): boolean {
  return heldSeats < totalSeats;
}

/** The (1-based) seat number a new reservation receives. */
export function nextSeatNumber(heldSeats: number): number {
  return heldSeats + 1;
}
