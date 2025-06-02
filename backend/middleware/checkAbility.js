const { AbilityBuilder, Ability } = require('@casl/ability');

function defineAbilitiesFor(role) {
  const { can, cannot, build } = new AbilityBuilder(Ability);

  if (role === 'admin') {
    can('manage', 'all'); // toàn quyền
  } else if (role === 'user') {
    can('read', 'Post');
    can('create', 'Comment');
    cannot('delete', 'Post');
  }

  return build();
}

module.exports = defineAbilitiesFor;
