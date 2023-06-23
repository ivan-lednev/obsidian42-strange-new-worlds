import { createContextTree } from "./create-context-tree";
import {collapseEmptyNodes} from "./collapse-empty-nodes";

test("builds a tree with top-level links", () => {
  const fileContents = `[[target]]`;

  const linksToTarget = [
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
      linksToTarget,
      fileContents,
      ...cache,
    })
  ).toMatchObject({
    sectionsWithMatches: [
      {
        text: `[[target]]`,
      },
    ],
    childHeadings: [],
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
      linksToTarget: backlinks,
      fileContents,
      ...cache,
    })
  ).toMatchObject({
    sectionsWithMatches: [],
    childHeadings: [
      {
        text: "H1",
        sectionsWithMatches: [],
        childHeadings: [
          {
            text: "H2",
            sectionsWithMatches: [
              {
                text: "[[target]]",
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

  const linksToTarget = [
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
      linksToTarget,
      fileContents,
      ...cache,
    })
  ).toMatchObject({
    childLists: [
      {
        text: "- l1",
        childLists: [
          {
            text: "- l2",
            sectionsWithMatches: [
              { text: expect.stringContaining("- [[target]]") },
            ],
          },
        ],
      },
    ],
  });
});

test.todo("builds a tree with headings & lists");

test("gets only child list items to be displayed in a match section", () => {
  const fileContents = `- l1
\t- [[target]]
\t\t- child
`;

  const linksToTarget = [
    {
      position: {
        start: {
          line: 1,
          col: 3,
          offset: 8,
        },
        end: {
          line: 1,
          col: 13,
          offset: 18,
        },
      },
      link: "target",
      original: "[[target]]",
      displayText: "target",
    },
  ];

  const cache = {
    links: [
      {
        position: {
          start: {
            line: 1,
            col: 3,
            offset: 8,
          },
          end: {
            line: 1,
            col: 13,
            offset: 18,
          },
        },
        link: "target",
        original: "[[target]]",
        displayText: "target",
      },
    ],
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
            col: 9,
            offset: 28,
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
            col: 13,
            offset: 18,
          },
        },
        parent: 0,
      },
      {
        position: {
          start: {
            line: 2,
            col: 2,
            offset: 21,
          },
          end: {
            line: 2,
            col: 9,
            offset: 28,
          },
        },
        parent: 1,
      },
    ],
  };

  expect(
    createContextTree({
      linksToTarget,
      fileContents,
      ...cache,
    })
  ).toMatchObject({
    childLists: [
      {
        text: "- l1",
        sectionsWithMatches: [
          // todo: contains the whole list. We need only sub-items
          {
            text: `- [[target]]
\t- child`,
          },
        ],
      },
    ],
  });
});

test("gets section contents if the link is in a heading", () => {
  const fileContents = `# H1
## H2 [[target]]
this is the water
and this is the well
`;

  const backlinks = [
    {
      position: {
        start: {
          line: 1,
          col: 6,
          offset: 11,
        },
        end: {
          line: 1,
          col: 16,
          offset: 21,
        },
      },
      link: "target",
      original: "[[target]]",
      displayText: "target",
    },
  ];

  const cache = {
    links: [
      {
        position: {
          start: {
            line: 1,
            col: 6,
            offset: 11,
          },
          end: {
            line: 1,
            col: 16,
            offset: 21,
          },
        },
        link: "target",
        original: "[[target]]",
        displayText: "target",
      },
    ],
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
            col: 16,
            offset: 21,
          },
        },
        heading: "H2 [[target]]",
        display: "H2 target",
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
            col: 16,
            offset: 21,
          },
        },
      },
      {
        type: "paragraph",
        position: {
          start: {
            line: 2,
            col: 0,
            offset: 22,
          },
          end: {
            line: 3,
            col: 20,
            offset: 60,
          },
        },
      },
    ],
  };

  expect(
    createContextTree({
      linksToTarget: backlinks,
      fileContents,
      ...cache,
    })
  ).toMatchObject({
    sectionsWithMatches: [],
    childHeadings: [
      {
        text: "H1",
        sectionsWithMatches: [
          {
            text: `## H2 [[target]]
this is the water
and this is the well`,
          },
        ],
        childHeadings: [],
      },
    ],
  });
});

