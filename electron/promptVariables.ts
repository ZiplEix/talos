export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'boolean' | 'array';
  children?: TemplateVariable[];
  usage: string;
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  {
    name: 'currentCwd',
    description: 'Le dossier de travail actuel (Current Working Directory)',
    type: 'string',
    usage: '{{currentCwd}}'
  },
  {
    name: 'chatFolder',
    description: 'Le dossier des artifacts du chat en cours',
    type: 'string',
    usage: '{{chatFolder}}'
  },
  {
    name: 'hasTools',
    description: 'Booléen indiquant si des outils sont disponibles dans ce mode',
    type: 'boolean',
    usage: '{{#if hasTools}}...{{/if}}'
  },
  {
    name: 'tools',
    description: 'Liste des outils disponibles dans le mode actuel',
    type: 'array',
    usage: '{{#each tools}}...{{/each}}',
    children: [
      {
        name: 'name',
        description: 'Nom de l\'outil',
        type: 'string',
        usage: '{{name}}'
      },
      {
        name: 'description',
        description: 'Description de l\'outil',
        type: 'string',
        usage: '{{description}}'
      }
    ]
  }
];

export const TEMPLATE_SYNTAX_HELP = [
  {
    syntax: '{{variable}}',
    description: 'Affiche la valeur d\'une variable simple (chaîne ou booléen)'
  },
  {
    syntax: '{{#if variable}}...{{/if}}',
    description: 'Affiche le contenu uniquement si la variable est définie et non-vide'
  },
  {
    syntax: '{{#each list}}...{{/each}}',
    description: 'Itère sur un tableau et répète le contenu pour chaque élément'
  },
  {
    syntax: '{{this}}',
    description: 'Dans une boucle #each, fait référence à l\'élément courant si c\'est une valeur primitive'
  }
];