import { createContextTree } from "./create-context-tree";

test("builds a tree with top-level links", () => {
  const fileContents = `[[target]]`;

  const backlinks = [
    {
      position: {
        start: {
          line: 0,
          col: 0,
          offset: 0,
        },
        end: {
          line: 0,
          col: 10,
          offset: 10,
        },
      },
      link: "target",
      original: "[[target]]",
      displayText: "target",
    },
  ];

  const cache = {
    sections: [
      {
        type: "paragraph",
        position: {
          start: {
            line: 0,
            col: 0,
            offset: 0,
          },
          end: {
            line: 0,
            col: 10,
            offset: 10,
          },
        },
      },
    ],
  };

  expect(
    createContextTree({
      backlinks,
      fileContents,
      ...cache,
    })
  ).toMatchObject({
    sectionsWithLinks: [
      {
        position: {
          start: {
            offset: 0,
          },
        },
      },
    ],
    children: [],
  });
});

test("builds a tree with nested headings", () => {
  const fileContents = `# H1
## H2
[[target]]
`;

  const backlinks = [
    {
      position: {
        start: {
          line: 2,
          col: 0,
          offset: 11,
        },
        end: {
          line: 2,
          col: 10,
          offset: 21,
        },
      },
      link: "target",
      original: "[[target]]",
      displayText: "target",
    },
  ];

  const cache = {
    headings: [
      {
        position: {
          start: {
            line: 0,
            col: 0,
            offset: 0,
          },
          end: {
            line: 0,
            col: 4,
            offset: 4,
          },
        },
        heading: "H1",
        display: "H1",
        level: 1,
      },
      {
        position: {
          start: {
            line: 1,
            col: 0,
            offset: 5,
          },
          end: {
            line: 1,
            col: 5,
            offset: 10,
          },
        },
        heading: "H2",
        display: "H2",
        level: 2,
      },
    ],
    sections: [
      {
        type: "heading",
        position: {
          start: {
            line: 0,
            col: 0,
            offset: 0,
          },
          end: {
            line: 0,
            col: 4,
            offset: 4,
          },
        },
      },
      {
        type: "heading",
        position: {
          start: {
            line: 1,
            col: 0,
            offset: 5,
          },
          end: {
            line: 1,
            col: 5,
            offset: 10,
          },
        },
      },
      {
        type: "paragraph",
        position: {
          start: {
            line: 2,
            col: 0,
            offset: 11,
          },
          end: {
            line: 2,
            col: 10,
            offset: 21,
          },
        },
      },
    ],
  };

  expect(
    createContextTree({
      backlinks,
      fileContents,
      ...cache,
    })
  ).toMatchObject({
    sectionsWithLinks: [],
    children: [
      {
        sectionsWithLinks: [],
        headingCache: {
          heading: "H1",
        },
        children: [
          {
            headingCache: {
              heading: "H2",
            },
            sectionsWithLinks: [
              {
                position: {
                  start: { offset: 11 },
                },
              },
            ],
          },
        ],
      },
    ],
  });
});

test("builds a tree with nested lists", () => {
  const fileContents = `- l1
	- l2
		- [[target]]
`;

  const backlinks = [
    {
      position: {
        start: {
          line: 2,
          col: 4,
          offset: 15,
        },
        end: {
          line: 2,
          col: 14,
          offset: 25,
        },
      },
      link: "target",
      original: "[[target]]",
      displayText: "target",
    },
  ];

  const cache = {
    sections: [
      {
        type: "list",
        position: {
          start: {
            line: 0,
            col: 0,
            offset: 0,
          },
          end: {
            line: 2,
            col: 14,
            offset: 25,
          },
        },
      },
    ],
    listItems: [
      {
        position: {
          start: {
            line: 0,
            col: 0,
            offset: 0,
          },
          end: {
            line: 0,
            col: 4,
            offset: 4,
          },
        },
        parent: -1,
      },
      {
        position: {
          start: {
            line: 1,
            col: 1,
            offset: 6,
          },
          end: {
            line: 1,
            col: 5,
            offset: 10,
          },
        },
        parent: 0,
      },
      {
        position: {
          start: {
            line: 2,
            col: 2,
            offset: 13,
          },
          end: {
            line: 2,
            col: 14,
            offset: 25,
          },
        },
        parent: 1,
      },
    ],
  };

  expect(
    createContextTree({
      backlinks,
      fileContents,
      ...cache,
    })
  ).toMatchObject({
    sectionsWithLinks: [],
    childLists: [],
    children: [], // todo: rename
  });
});

test.todo("works with links inside headings");

test.todo("Preserves positions of text matches in sections");
