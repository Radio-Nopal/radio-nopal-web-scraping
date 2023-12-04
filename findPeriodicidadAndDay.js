function findPeriodicidadAndDay(inputString) {
  let lowercaseInput = inputString.toLowerCase();

  let periodicidad = "";
  let dias = "";

  // Regular expression patterns for periodicity and day names with and without accents
  let periodicityRegex = /(diario|quincenal|semanal|mensual)/;
  let daysRegex = /lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo/g;

  // Use regex to find periodicity in the input string
  let matchedPeriodicity = lowercaseInput.match(periodicityRegex);

  // Use regex to find day names in the input string
  let matchedDays = lowercaseInput.match(daysRegex);

  // Extract the first matched periodicity and day name (if any)
  if (matchedPeriodicity && matchedPeriodicity.length > 0) {
    periodicidad = matchedPeriodicity[0];
  }

  if (matchedDays && matchedDays.length > 0) {
    dias = matchedDays[0];
  }

  return { periodicidad, dias };
}

module.exports = findPeriodicidadAndDay;
