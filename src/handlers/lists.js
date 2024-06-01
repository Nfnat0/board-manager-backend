const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();
const { addCorsHeaders } = require("../utils");
const listsTableName = process.env.LISTS_TABLE;
const cardsTableName = process.env.CARDS_TABLE;
const { v4: uuidv4 } = require('uuid');

exports.getLists = async () => {
  const params = {
    TableName: listsTableName,
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

exports.addList = async (event) => {
  const body = JSON.parse(event.body);
  const params = {
    TableName: listsTableName,
    Item: {
      listId: body.listId,
      boardId: body.boardId,
      title: body.title,
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

exports.editList = async (event) => {
  const body = JSON.parse(event.body);
  const params = {
    TableName: listsTableName,
    Key: { listId: body.listId },
    UpdateExpression: "set title = :title",
    ExpressionAttributeValues: {
      ":title": body.title,
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

exports.deleteList = async (event) => {
  const listId = event.pathParameters.listId;

  // Delete associated cards
  try {
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

    const listParams = {
      TableName: listsTableName,
      Key: { listId },
    };
    await dynamo.delete(listParams).promise();

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
