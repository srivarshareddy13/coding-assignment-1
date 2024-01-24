const express = require('express');
const path = require('path');
const {open} = require('sqlite');
const sqlite3 = require('sqlite3');
const format = require('date-fns/format');
const isMatch = require('date-fns/isMatch');
const isValid = request('date-fns/isValid');

const app = express();
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log('Success')
    });
  } catch (e) {
    console.log(`DB Error: '${e.message}'`)
    process.exit(1)
  };
};
initializeDbAndServer();
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined
}
const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
};
const hasSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined
}
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}
const convertTO = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}
//api 1
app.get('/todos/', async (request, response) => {
  const {search_q = '', priority, status, category} = request.query
  let getQuery = ''
  let data = null
  switch (true) {
    case hasStatus(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getQuery = `
            SELECT *
            FROM todo
            WHERE status = '${status}';
          `
        data = await db.all(getQuery)
        response.send(data.map(each => convertTO(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasPriority(request.query):
      if (priority === 'HIGH' || status === 'LOW' || status === 'MEDIUM') {
        getQuery = `
            SELECT *
            FROM todo
            WHERE priority = '${priority}';
          `
        data = await db.all(getQuery)
        response.send(data.map(each => convertTO(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasPriorityAndStatus(request.query):
      if (priority === 'HIGH' || status === 'LOW' || status === 'MEDIUM') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getQuery = `
              SELECT *
              FROM todo
              WHERE status = '${status}'
                    AND priority = '${priority}';
            `
          data = await db.all(getQuery)
          response.send(data.map(each => convertTO(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasSearch(request.query):
      getQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%{search_q}%';
        `
      data = await db.all(getQuery)
      response.send(data.map(each => convertTO(each)))
      break
    case hasCategoryAndStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getQuery = `
                SELECT *
                FROM todo
                WHERE status = '${status}' AND category = '${category}';
              `
          const data = await db.all(getQuery)
          response.send(data.map(each => convertTO(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategory(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getQuery = `
                SELECT *
                FROM todo
                WHERE category = '${category}';
              `
        data = await db.all(getQuery)
        response.send(data.map(each => convertTO(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (priority === 'HIGH' || status === 'LOW' || status === 'MEDIUM') {
          getQuery = `
                SELECT *
                FROM todo
                WHERE priority = '${priority}' AND category = '${category}';
              `
          data = await db.all(getQuery)
          response.send(data.map(each => convertTO(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    default:
      getQuery = `
            SELECT *
            FROM todo;
          `
      data = await db.all(getQuery)
      response.send(data.map(each => convertTO(each)))
  }
});

//api 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getQuery = `
    SELECT *
    FROM todo 
    WHERE id = ${todoId};
  `
  const data = await db.get(getQuery)
  response.send(convertTO(data));
});
//api 3 
app.get("/agenda/", async (request,response) => {
  const {date} = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");

    const getQuery = `
      SELECT *
      FROM todo
      WHERE due_date = '${newDate}';
    `;
    const data = await db.all(getQuery)
    response.send(data.map(each => convertTO(each)))
  } else {
    response.status(400)
    response.send("Invalid Due Date");
  };
});
//api 4
app.post("/todos/", async (request,response)=> {
  const {id, todo, priority, status, category, dueDate} = request.body 
  if (priority === 'HIGH' || status === 'LOW' || status === 'MEDIUM') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (category === 'WORK' || category === 'HOME' || category === 'LEARNING') {
        if (isMatch(date, "yyyy-MM-dd")) {
          const newDate = format(new Date(date), "yyyy-MM-dd"); 

          getQuery = `
            INSERT INTO 
              todo (id, todo, priority, status, category, dueDate)
            VALUES (
              ${id},
              '${todo}',
              '${priority}',
              '${status}',
              '${category}',
              '${newDate}'
            );
          `;
          const data = await db.run(getQuery)
          response.send("Todo Successfully Added")

        } else {
          response.status(400)
           response.send("Invalid Due Date");
        }

      } else {
          response.status(400)
        response.send('Invalid Todo Category')
      }

    } else {
      response.status(400)
        response.send('Invalid Todo Status')
    }

  } else {
    response.status(400)
        response.send('Invalid Todo Priority')
  }
})
//api 5 
app.put("/todos/:todoId/", async (request,response) => {
  const {todoId} = request.params;
  const requestBody = request.body; 

  let updateColumn = "" 

  const prevQuery = `SELECT * FROM todo WHERE id= ${todoId}` 
  const prevTodo = await db.get(prevQuery) 

  const {
    todo = prevTodo.todo,
    priority = prevTodo.priority,
    status = prevTodo.status,
    category = prevTodo.category,
    dueDate= prevTodo.dueDate
  } = request.body;

  let updateTodo 

  switch (true) {
      case (requestBody.status !== undefined):
          if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
            updateTodo = `UPDATE todo
             SET 
                todo='${todo}', 
                priority='${priority}', 
                status='${status}',
                  category='${category}', 
                  due_date='${dueDate}'
            WHERE id=${todoId}; `;
            await db.run(updateTodo)
            response.send("Status Updated")
          } else {
            response.status(400)
            response.send('Invalid Todo Status')
          } 
        break;
      case (requestBody.priority !== undefined):
          if (priority === 'HIGH' || status === 'LOW' || status === 'MEDIUM') {
            updateTodo = `UPDATE todo
                           SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}'
                          WHERE id=${todoId}; `;
            await db.run(updateTodo)
            response.send("Priority Updated")
          } else {
            response.status(400)
            response.send('Invalid Todo Priority')
          } 
        break;
      case (requestBody.category !== undefined):
          if (category === 'WORK' || category === 'HOME' || category === 'LEARNING') {
            updateTodo = `UPDATE todo 
                          SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}'
                          WHERE id=${todoId}; `;
            await db.run(updateTodo)
            response.send("Category Updated")
          } else {
            response.status(400)
            response.send('Invalid Todo Category')
          } 
        break;
      case (requestBody.due_date !== undefined):
          if (isMatch(dueDate, "yyyy-MM-dd")) {
            const newDate = format(new Date(dueDate), "yyyy-MM-dd"); 
            updateTodo = `UPDATE todo 
                          SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}'
                          WHERE id=${todoId}; `;
            await db.run(updateTodo)
            response.send("Due Date Updated")
          } else {
            response.status(400)
            response.send('Invalid Todo Status')
          } 
        break; 
      case (requestBody.todo !== undefined):
          updateTodo = `
              UPDATE todo 
              SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}'
              WHERE id=${todoId};`;
          await db.run(updateTodo)
            response.send("Todo Updated");
        break;

      
  };

});
//api 6 
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params;
  const getQuery = `
        DELETE FROM
            todo 
        WHERE 
            id = ${todoId};
    `
  const data = await db.run(getQuery)
  response.send('Todo Deleted')
})

module.exports = app;
