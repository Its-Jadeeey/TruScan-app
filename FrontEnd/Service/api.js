export const analyzeMessage = async (text) => {
  const res = await fetch("https://your-backend.onrender.com/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  });
  return res.json();
};