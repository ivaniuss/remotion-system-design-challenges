import type {WorldName} from '../spec/vocab';
import {axon} from './axon';
import {membrane} from './membrane';
import {network} from './network';
import {neuron} from './neuron';
import {soma} from './soma';
import {synapse} from './synapse';
import type {World} from './types';

// The worlds of `shot` scenes. Each name, its events and its anchors are declared in
// WORLD_INFO (src/spec/vocab.ts) so the validator and the guide know them.
export const WORLD_DRAW: Record<WorldName, World> = {network, neuron, soma, membrane, axon, synapse};
