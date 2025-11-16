import { useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const DemoTasks = ({ user, onComplete }) => {
  useEffect(() => {
    if (user) {
      createDemoTasks();
    }
  }, [user]);

  const createDemoTasks = async () => {
    const demoTasks = [
      {
        text: "Complete morning workout routine",
        notes: "30 minutes cardio + strength training",
        category: "Health",
        priority: "high",
        dueDate: new Date().toISOString().split('T')[0],
        completed: false,
        userId: user.uid,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        text: "Review quarterly sales report",
        notes: "Analyze Q3 performance and prepare presentation for stakeholders",
        category: "Work",
        priority: "high",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // tomorrow
        completed: false,
        userId: user.uid,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        text: "Buy groceries for the week",
        notes: "Milk, bread, eggs, vegetables, fruits, chicken",
        category: "Personal",
        priority: "medium",
        dueDate: new Date().toISOString().split('T')[0],
        completed: true,
        completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        userId: user.uid,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        text: "Call mom for her birthday",
        notes: "Don't forget to wish her happy birthday and ask about the family dinner plans",
        category: "Personal",
        priority: "high",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // day after tomorrow
        completed: false,
        userId: user.uid,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      },
      {
        text: "Learn React hooks tutorial",
        notes: "Complete the advanced hooks section on the online course",
        category: "Learning",
        priority: "medium",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // next week
        completed: false,
        userId: user.uid,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      },
      {
        text: "Schedule dentist appointment",
        notes: "Regular checkup and cleaning - call Dr. Smith's office",
        category: "Health",
        priority: "low",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks
        completed: false,
        userId: user.uid,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        text: "Prepare presentation slides",
        notes: "Create slides for Monday's team meeting about project roadmap",
        category: "Work",
        priority: "high",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days
        completed: true,
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        userId: user.uid,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        text: "Read 'Atomic Habits' book",
        notes: "Finish chapters 5-8 this week",
        category: "Learning",
        priority: "low",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days
        completed: false,
        userId: user.uid,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    ];

    try {
      for (const task of demoTasks) {
        await addDoc(collection(db, 'tasks'), task);
      }
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error creating demo tasks:', error);
    }
  };

  return null;
};

export default DemoTasks;