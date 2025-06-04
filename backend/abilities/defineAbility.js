// backend/utils/ability.js (Ví dụ)
const { AbilityBuilder, createMongoAbility } = require('@casl/ability');

function defineAbilityForUser(user) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    can('read', 'Problem'); // Mọi người đều có thể đọc Problem

    if (user) {
        can('create', 'Submission');
        can('read', 'User', { _id: user.id });
        can('update', 'User', { _id: user.id });

        if (user.role === 'admin') {
            can('manage', 'all'); 
        } else if (user.role === 'creator') { 
            can('create', 'Problem'); 
            // Creator chỉ có thể update/delete Problem nếu creatorId của problem khớp với _id của họ
            can('update', 'Problem', { creatorId: user.id }); 
            can('delete', 'Problem', { creatorId: user.id }); 
        }
    }
    return build();
}

module.exports = { defineAbilityForUser };