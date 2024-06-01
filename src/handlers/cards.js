const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const { addCorsHeaders } = require('./utils');
const cardsTableName = process.env.CARDS_TABLE;
const { v4: uuidv4 } = require('uuid');

exports.getCardsByBoard = async (event) => {
  const params = {
    TableName: cardsTableName,
    FilterExpression: 'boardId = :boardId',
    ExpressionAttributeValues: {
      ':boardId': event.pathParameters.boardId,
    },
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

exports.addCard = async (event) => {
  const body = JSON.parse(event.body);
  const params = {
    TableName: cardsTableName,
    Item: {
      cardId: uuidv4(),
      boardId: body.boardId,
      listId: body.listId,
      name: body.name,
      details: body.details,
      expirationDate: body.expirationDate,
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

exports.editCard = async (event) => {
  const body = JSON.parse(event.body);
  const params = {
    TableName: cardsTableName,
    Key: { cardId: body.cardId },
    UpdateExpression: 'set name = :name, details = :details, expirationDate = :expirationDate',
    ExpressionAttributeValues: {
      ':name': body.name,
      ':details': body.details,
      ':expirationDate': body.expirationDate,
    },
    ReturnValues: 'UPDATED_NEW',
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

exports.deleteCard = async (event) => {
  const params = {
    TableName: cardsTableName,
    Key: { cardId: event.pathParameters.cardId },
  };
  try {
    await dynamo.delete(params).promise();
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
