﻿"use strict";
///<reference path="../references.ts" />

interface Rectangle {
    x: number;
    y: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
}

class Organism {
    Id: number;
    ImagePath: string;
    GeneCount: number;
}

class Gene {
    Pos: number[];
    Color: number[];
}

class Dna {
    Genes: Gene[];
    Generation: number;
    Mutation: number;
    Fitness: number;
    Organism: Organism;
}

interface IMutatorState {
    oldGene: Gene;
    newGene: Gene;
    index: number;

}

interface IGeneMutator {
    name: string;
    effectiveness: number;
    func: (dna: Dna, rect: Rectangle) => IMutatorState;
    undo: (dna: Dna, state: IMutatorState) => void;
}


class GeneMutator {
    static StartingEffectiveness = 1000000;
    static EffectivenessChangeRate = 0.03;
    static MinimumEffectiveness = 0.00001;

    static Buffer: Uint8Array;
    static posBuffer: number[] = new Array(6);
    static colorBuffer: number[] = new Array(6);

    static MutateDna(mutator: IGeneMutator, dna: Dna, source: number[], rect: Rectangle, mutations: any[]) {
        var mutatorState = mutator.func(dna, rect);
        if (mutatorState == null)
            return;

        for (var i = 0; i < mutatorState.newGene.Pos.length; i += 2)
            if (mutatorState.newGene.Pos[i] < rect.x || mutatorState.newGene.Pos[i] > rect.x2)
                return mutator.undo(dna, mutatorState)

        for (var i = 1; i < mutatorState.newGene.Pos.length; i += 2)
            if (mutatorState.newGene.Pos[i] < rect.y || mutatorState.newGene.Pos[i] > rect.y2)
                return mutator.undo(dna, mutatorState)

        var fitness = this.GetFitness(dna, source);

        if (fitness < dna.Fitness) {
            dna.Fitness = fitness;
            dna.Mutation++;
            mutations.push(mutatorState);
        }
        else {
            mutator.undo(dna, mutatorState);
        }

        dna.Generation++;
    }


    static GetFitness(dna: Dna, source: number[]) {
        if (!this.Buffer)
            this.Buffer = new Uint8ClampedArray(globalWidth * globalHeight * 4);

        for (var i = 0; i < this.Buffer.length; i++)
            this.Buffer[i] = 255;

        for (var i = 0; i < dna.Genes.length; i++) {
            var gene = dna.Genes[i];

            for (var c = 0; c < 3; c++)
                this.colorBuffer[c] = Math.floor(gene.Color[c] * 255);
            this.colorBuffer[3] = gene.Color[3];

            for (var c = 0; c < gene.Pos.length; c++)
                this.posBuffer[c] = Math.floor(gene.Pos[c] * globalHeight);

            Raster.drawPolygon(this.Buffer, globalWidth, globalHeight, this.posBuffer, this.colorBuffer);
        }

        return this.calculateFitness(source, this.Buffer);
    }

    static calculateFitness(buff1: number[], buff2: Int8Array) {
        var diff = 0.0;
        for (var i = 0; i < buff1.length; i++) {
            var q = Math.abs(buff1[i] - buff2[i]);
            diff += q * q;
        }
        return diff;
    }

    public static DefaultMutateGene(dna: Dna) {
        if (dna.Genes.length == 0)
            return null;

        var gene = new Gene();
        var index = Utils.randomIndex(dna.Genes);
        var oldGene = dna.Genes[index];

        dna.Genes[index] = gene;
        return { index: index, oldGene: oldGene, newGene: gene };
    }

    public static GeneMutators: IGeneMutator[] = [
        {
            name: 'ColorOnly',
            effectiveness: 10000000,
            func: function (dna: Dna, rect: Rectangle) {
                var state = GeneMutator.DefaultMutateGene(dna);
                if (state == null) return null;

                state.newGene.Color = state.oldGene.Color.slice();
                state.newGene.Pos = state.oldGene.Pos.slice();

                var indexToChange = Utils.randomFromTo(0, 4);
                state.newGene.Color[indexToChange] = Utils.ClampFloat((Math.random() - 0.5) * 0.1 + state.newGene.Color[indexToChange]);
                return state;
            },
            undo: (dna, state) => dna.Genes[state.index] = state.oldGene
        },
        {
            name: 'MoveGene',
            effectiveness: 10000000,
            func: function (dna: Dna, rect: Rectangle) {
                var state = GeneMutator.DefaultMutateGene(dna);
                if (state == null) return null;

                state.newGene.Color = state.oldGene.Color.slice();
                state.newGene.Pos = new Array(6);
                for (var i = 0; i < state.newGene.Pos.length; i += 2)
                    state.newGene.Pos[i] = Math.random() * 1.2 * rect.width - 0.1 * rect.width;
                for (var i = 1; i < state.newGene.Pos.length; i += 2)
                    state.newGene.Pos[i] = Math.random() * 1.2 * rect.height - 0.1 * rect.height;
                return state;
            },
            undo: (dna, state) => dna.Genes[state.index] = state.oldGene
        },
        {
            name: 'MoveGenePart',
            effectiveness: 10000000,
            func: function (dna: Dna, rect: Rectangle) {
                var state = GeneMutator.DefaultMutateGene(dna);
                if (state == null) return null;

                state.newGene.Color = state.oldGene.Color.slice();
                state.newGene.Pos = state.oldGene.Pos.slice();

                var indexToMove = Utils.randomIndex(state.newGene.Pos);
                if (indexToMove % 2 == 0)
                    state.newGene.Pos[indexToMove] += (Math.random() - 0.5) * 0.1 * rect.width;
                else
                    state.newGene.Pos[indexToMove] += (Math.random() - 0.5) * 0.1 * rect.height;
                return state;
            },
            undo: (dna, state) => dna.Genes[state.index] = state.oldGene
        },
        {
            name: 'All Random',
            effectiveness: 10000000,
            func: function (dna: Dna, rect: Rectangle) {
                var state = GeneMutator.DefaultMutateGene(dna);
                if (state == null) return null;

                state.newGene.Color = [Math.random(), Math.random(), Math.random(), 1 / (1 + dna.Generation * 0.0002)];
                state.newGene.Pos = new Array(6);

                for (var i = 0; i < state.newGene.Pos.length; i += 2)
                    state.newGene.Pos[i] = Math.random() * 1.2 * rect.width + rect.x - 0.1 * rect.width ;

                for (var i = 1; i < state.newGene.Pos.length; i += 2)
                    state.newGene.Pos[i] = Math.random() * 1.2 * rect.height + rect.y - 0.1 * rect.height;

                return state;
            },
            undo: (dna, state) => dna.Genes[state.index] = state.oldGene
        },
        {
            name: 'Add Small Triangle',
            effectiveness: 2000,
            func: function (dna: Dna, rect: Rectangle) {
                var gene = new Gene();
                gene.Color = [Math.random(), Math.random(), Math.random(), 1 / (1 + dna.Generation * 0.0002)];
                gene.Pos = [Math.random() * rect.width + rect.x, Math.random() * rect.height + rect.y, 0, 0, 0, 0];
                gene.Pos[2] = gene.Pos[0] + Math.random() * 0.2 * rect.width - 0.1 * rect.width;
                gene.Pos[3] = gene.Pos[1] + Math.random() * 0.2 * rect.height - 0.1 * rect.height;
                gene.Pos[4] = gene.Pos[0] + Math.random() * 0.2 * rect.width - 0.1 * rect.width;
                gene.Pos[5] = gene.Pos[1] + Math.random() * 0.2 * rect.height - 0.1 * rect.height;

                dna.Genes.push(gene);
                return { index: dna.Genes.length - 1, oldGene: null, newGene: gene };
            },
            undo: (dna, state) => dna.Genes.splice(state.index, 1)
        },
        {
            name: 'Add Big Triangle',
            effectiveness: 1000000,
            func: function (dna: Dna, rect: Rectangle) {
                var gene = new Gene();
                gene.Color = [Math.random(), Math.random(), Math.random(), 1 / (1 + dna.Generation * 0.0002)];
                gene.Pos = new Array(6);

                for (var i = 0; i < gene.Pos.length; i += 2)
                    gene.Pos[i] = Math.random() * rect.width + rect.x;

                for (var i = 1; i < gene.Pos.length; i += 2)
                    gene.Pos[i] = Math.random() * rect.height + rect.y;


                dna.Genes.push(gene);
                return { index: dna.Genes.length - 1, oldGene: null, newGene: gene };
            },
            undo: (dna, state) => dna.Genes.splice(state.index, 1)
        }
    ];

    public static GetMutator(): IGeneMutator {
        var totalEffectivess = 0;
        for (var i = 0; i < this.GeneMutators.length; i++)
            totalEffectivess += this.GeneMutators[i].effectiveness;

        var bias = Math.random() * totalEffectivess;
        var currentEffectiveness = 0;
        var mutator = this.GeneMutators[this.GeneMutators.length - 1];

        for (var i = 0; i < this.GeneMutators.length; i++) {
            currentEffectiveness += this.GeneMutators[i].effectiveness;

            if (currentEffectiveness > bias) {
                mutator = this.GeneMutators[i];
                break;
            }
        }

        return mutator;
    }

    public static UpdateEffectiveness(fitnessDiff: number, mutator: IGeneMutator) {
        if (isFinite(fitnessDiff)) {
            mutator.effectiveness = mutator.effectiveness * (1 - this.EffectivenessChangeRate) +
            fitnessDiff * this.EffectivenessChangeRate;
            mutator.effectiveness = Math.max(mutator.effectiveness, this.MinimumEffectiveness);
        }
    }
}