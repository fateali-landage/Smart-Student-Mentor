import React, { useState, useEffect } from "react";
import BASE_URL from "../../api";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);

  const [newGoal, setNewGoal] = useState({
    title: "",
    priority: "medium",
    deadline: "",
  });

  // 🔥 FETCH GOALS FROM BACKEND
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/goals`);
        const data = await res.json();
        setGoals(data);
      } catch (err) {
        console.error(err);
        alert("Server not reachable. Please try again.");
      }
    };
    fetchGoals();
  }, []);

  // 🔥 ADD GOAL (BACKEND)
  const handleAddGoal = async (e) => {
    e.preventDefault();

    if (!newGoal.title) return;

    try {
      await fetch(`${BASE_URL}/api/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newGoal),
      });

      // Refresh goals after adding
      const res = await fetch(`${BASE_URL}/api/goals`);
      const data = await res.json();
      setGoals(data);

      setNewGoal({ title: "", priority: "medium", deadline: "" });
    } catch (error) {
      console.error(error);
      alert("Server not reachable. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f7f9fb]">

      <main className="flex-1 p-8 space-y-8">

        {/* HEADER */}
        <div className="flex justify-between">
          <div>
            <h1 className="text-4xl font-bold">Academic Goals</h1>
            <p className="text-gray-500">
              Curating your path to excellence
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
            <p className="text-xs text-gray-400">SUCCESS RATE</p>
            <h2 className="text-2xl font-bold text-indigo-600">84%</h2>
          </div>
        </div>

        {/* ADD GOAL */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Add New Goal</h2>

          <form onSubmit={handleAddGoal} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Goal Title"
              className="col-span-2 p-3 border rounded"
              value={newGoal.title}
              onChange={(e) =>
                setNewGoal({ ...newGoal, title: e.target.value })
              }
            />

            <input
              type="date"
              className="p-3 border rounded"
              value={newGoal.deadline}
              onChange={(e) =>
                setNewGoal({ ...newGoal, deadline: e.target.value })
              }
            />

            <select
              className="p-3 border rounded"
              value={newGoal.priority}
              onChange={(e) =>
                setNewGoal({ ...newGoal, priority: e.target.value })
              }
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button className="col-span-2 bg-indigo-600 text-white py-3 rounded">
              Create Goal
            </button>
          </form>
        </div>

        {/* GOALS LIST */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Active Goals</h3>

          {goals.map((goal) => (
            <div key={goal.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
              <div className="flex justify-between mb-4">
                <h4 className="font-bold">{goal.title}</h4>
                <span className="text-sm text-gray-500">
                  {new Date(goal.deadline).toLocaleDateString()}
                </span>
              </div>

              <div className="mb-2">
                <span className="text-sm text-gray-400">
                  Progress: {goal.progress}%
                </span>
              </div>

              <div className="h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-indigo-600 rounded"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}