import { arrayConfig, field, listViewConfig, rootConfig, section, viewConfig } from '@cccteam/ccc-lib';
import { Resources, Users } from '../core/generated/zz_gen_constants';
import { Users as UsersResource } from '../core/generated/zz_gen_resources';

export const usersConfig = rootConfig({
  nav: {
    navItem: {
      label: 'Users',
    },
    group: 'Data',
  },
  parentConfig: listViewConfig({
    title: 'Users',
    createTitle: 'Create User',
    createConfig: viewConfig({
      primaryResource: Resources.Users,
      elements: [
        section({
          label: 'User Information',
          children: [
            field({
              name: Users.fieldName.username,
              label: 'Username',
            }),
          ],
        }),
      ],
    }),
    primaryResource: Resources.Users,
    listColumns: [{ id: Users.fieldName.id }, { id: Users.fieldName.username }],
    elements: [
      section({
        label: 'User Information',
        children: [
          field({
            name: Users.fieldName.id,
            label: 'ID',
          }),
          field({
            name: Users.fieldName.username,
            label: 'Username',
          }),
        ],
      }),
    ],
  }),
  relatedConfigs: [
    arrayConfig({
      title: 'All Other Users',
      listFilter: (user: UsersResource) => `${Users.fieldName.id}:ne:${user.id}`,
      primaryResource: Resources.Users,
      iteratedConfig: listViewConfig({
        primaryResource: Resources.Users,
        listColumns: [{ id: Users.fieldName.id }, { id: Users.fieldName.username }],
        elements: [
          field({
            name: Users.fieldName.id,
            label: 'ID',
          }),
          field({
            name: Users.fieldName.username,
            label: 'Username',
          }),
        ],
      }),
    }),
  ],
});
