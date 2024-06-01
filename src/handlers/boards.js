const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();
const { addCorsHeaders } = require("../utils");
const boardsTableName = process.env.BOARDS_TABLE;
const listsTableName = process.env.LISTS_TABLE;
const cardsTableName = process.env.CARDS_TABLE;
const { v4: uuidv4 } = require('uuid');

exports.getBoards = async () => {
  const params = {
    TableName: boardsTableName,
  };
  try {
    const data = await dynamo.scan(params).promise();
    return addCorsHeaders({
      statusCode: 200,
      body: JSON.stringify(data.Items),
    });
  } catch (error) {
    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify(error),
    });
  }
};

exports.addBoard = async (event) => {
  const body = JSON.parse(event.body);
  const params = {
    TableName: boardsTableName,
    Item: {
      boardId: uuidv4(),
      title: body.title,
      description: body.description,
      icon: body.icon,
    },
  };
  try {
    await dynamo.put(params).promise();
    return addCorsHeaders({
      statusCode: 201,
      body: JSON.stringify(params.Item),
    });
  } catch (error) {
    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify(error),
    });
  }
};

exports.editBoard = async (event) => {
  const body = JSON.parse(event.body);
  const params = {
    TableName: boardsTableName,
    Key: { boardId: body.boardId },
    UpdateExpression:
      "set title = :title, description = :description, icon = :icon",
    ExpressionAttributeValues: {
      ":title": body.title,
      ":description": body.description,
      ":icon": body.icon,
    },
    ReturnValues: "UPDATED_NEW",
  };
  try {
    const data = await dynamo.update(params).promise();
    return addCorsHeaders({
      statusCode: 200,
      body: JSON.stringify(data.Attributes),
    });
  } catch (error) {
    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify(error),
    });
  }
};

exports.deleteBoard = async (event) => {
  const boardId = event.pathParameters.boardId;

  // Delete associated lists and cards
  try {
    const listsParams = {
      TableName: listsTableName,
      FilterExpression: "boardId = :boardId",
      ExpressionAttributeValues: {
        ":boardId": boardId,
      },
    };
    const listsData = await dynamo.scan(listsParams).promise();
    for (const list of listsData.Items) {
      await deleteListAndCards(list.listId);
    }

    const boardParams = {
      TableName: boardsTableName,
      Key: { boardId },
    };
    await dynamo.delete(boardParams).promise();

    return addCorsHeaders({
      statusCode: 200,
      body: JSON.stringify({}),
    });
  } catch (error) {
    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify(error),
    });
  }
};

const deleteListAndCards = async (listId) => {
  const cardsParams = {
    TableName: cardsTableName,
    FilterExpression: "listId = :listId",
    ExpressionAttributeValues: {
      ":listId": listId,
    },
  };
  const cardsData = await dynamo.scan(cardsParams).promise();
  for (const card of cardsData.Items) {
    await dynamo
      .delete({
        TableName: cardsTableName,
        Key: { cardId: card.cardId },
      })
      .promise();
  }
  await dynamo
    .delete({
      TableName: listsTableName,
      Key: { listId },
    })
    .promise();
};
