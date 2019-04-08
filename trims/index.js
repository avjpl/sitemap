exports.handler = async (event, context) => {
    console.log('value1 = ' + event);

    return 'success';
    // or
    // throw new Error("some error type");
};
