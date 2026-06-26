export const moodOptions = [
  { value: "Happy", emoji: "😊" },
  { value: "Hopeful", emoji: "🌱" },
  { value: "Calm", emoji: "😌" },
  { value: "Grateful", emoji: "💛" },
  { value: "Anxious", emoji: "😟" },
  { value: "Sad", emoji: "😢" },
  { value: "Angry", emoji: "😠" },
  { value: "Afraid", emoji: "😨" },
  { value: "Lonely", emoji: "🫧" },
  { value: "Tired", emoji: "😴" },
  { value: "Numb", emoji: "😶" },
];

export function getMoodDisplay(value: string | null) {
  if (!value) {
    return "No mood selected";
  }

  const option = moodOptions.find((mood) => mood.value === value);
  return option ? `${option.emoji} ${option.value}` : value;
}

export function getMoodDisplays(values: string[]) {
  if (!values || values.length === 0) {
    return ["No mood selected"];
  }

  return values.map((value) => getMoodDisplay(value));
}
