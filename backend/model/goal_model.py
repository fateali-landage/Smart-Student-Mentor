from db import get_db_connection

def get_goals():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM goals")
    goals = cursor.fetchall()

    conn.close()
    return goals

def add_goal(student_id, title):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO goals (student_id, title) VALUES (%s, %s)", (student_id, title))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Goal added successfully"}

def update_goal_progress(goal_id, progress):
    conn = get_db_connection()
    cursor = conn.cursor()
    status = 'Completed' if int(progress) >= 100 else 'In Progress'
    cursor.execute("UPDATE goals SET progress=%s, status=%s WHERE id=%s", (progress, status, goal_id))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Goal updated successfully"}