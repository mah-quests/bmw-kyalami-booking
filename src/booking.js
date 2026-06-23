export const validateRaceSlot = (requestedSlot, existingBookings) => {
  if (!requestedSlot) {
    throw new Error("Critical Parameter Missing: Invalid track query.");
  }
  const isConflict = existingBookings.includes(requestedSlot);
  return !isConflict;
};
