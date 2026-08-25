module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'isLocked', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'isLocked');
    },
};
