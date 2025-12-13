import { GraphQLClient } from 'graphql-request';

const GITHUB_ENDPOINT = 'https://api.github.com/graphql';

export const githubClient = new GraphQLClient(GITHUB_ENDPOINT, {
    headers: {
        authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
    },
});
