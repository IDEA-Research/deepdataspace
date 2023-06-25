db.getSiblingDB('admin').auth(
    'mongodb',
    'mongodb'
);
db.createUser({
    user: 'mongodb',
    pwd: 'mongodb',
    roles: ["readWrite"],
});
