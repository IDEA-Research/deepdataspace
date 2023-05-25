"""
deepdataspace.algos.graph

This file implements the graph data structure.
"""

import logging
from typing import Hashable
from typing import List

logger = logging.getLogger("algos.graph")


class Graph:
    """
    This implements a symple non-directed graph
    """

    def __init__(self, num_nodes):
        self._num_nodes = num_nodes
        self._map = [set() for _ in range(num_nodes)]

        self._has_circle = None

    @property
    def num_nodes(self):
        return self._num_nodes

    def add_edge(self, v: int, w: int):
        self._map[v].add(w)
        self._map[w].add(v)

        self._has_circle = None

    def _neighbor_nodes(self, v: int):
        return self._map[v]

    def neighbor_nodes(self, v: int):
        return self._neighbor_nodes(v)

    def _dfs_circle(self, v: int, from_v: int, visited: List[bool]):
        if visited[v] is True:
            return True

        visited[v] = True
        for w in self._neighbor_nodes(v):
            if w == from_v:
                continue
            if self._dfs_circle(w, v, visited) is True:
                return True

        visited[v] = False
        return False

    def has_circle(self):
        if self._has_circle is None:
            self._has_circle = None

            self._has_circle = False
            visited = [False] * self._num_nodes
            for v in range(self._num_nodes):
                if self._dfs_circle(v, v, visited):
                    self._has_circle = True
                    break

        return self._has_circle

    def _dfs_topo(self, v: int, visited: List[bool], orders: List[int]):
        if visited[v] is True:
            return

        visited[v] = True
        for w in self._neighbor_nodes(v):
            self._dfs_topo(w, visited, orders)
        orders.append(v)

    def topology_order(self):
        if self.has_circle():
            logger.warning(f"Graph cannot resolve topology order when there is a circle")
            return []

        orders = []
        visited = [False] * self._num_nodes
        for v in range(self._num_nodes):
            self._dfs_topo(v, visited, orders, )

        return orders


class DirectedGraph(Graph):
    """
    This implements a symple directed graph
    """

    def add_edge(self, v: int, w: int):
        self._map[v].add(w)
        self._has_circle = None

    def _dfs_circle(self, v: int, from_v: int, visited: List[bool]):
        if visited[v] is True:
            return True

        visited[v] = True
        for w in self._neighbor_nodes(v):
            if self._dfs_circle(w, v, visited) is True:
                return True

        visited[v] = False
        return False


class SymbolGraph(Graph):
    """
    This implements a symple non-directed symbol graph, whose nodes are symbols instead of int numbers.
    """

    def __init__(self, num_nodes):
        super(SymbolGraph, self).__init__(num_nodes)

        self._symbols2int = {}
        self._int2symbols = {}

    def add_node(self, v: Hashable):
        v_i = self._symbols2int.setdefault(v, len(self._symbols2int))
        self._int2symbols.setdefault(v_i, v)
        return v_i

    def add_edge(self, v: Hashable, w: Hashable):
        v_i = self.add_node(v)
        w_i = self.add_node(w)
        return super(SymbolGraph, self).add_edge(v_i, w_i)

    def neighbor_nodes(self, v: Hashable):
        v_i = self._symbols2int[v]
        _neighbors = self._neighbor_nodes(v_i)
        return [self._int2symbols[v] for v in _neighbors]

    def topology_order(self):
        orders = super(SymbolGraph, self).topology_order()
        return [self._int2symbols[v] for v in orders]


class DirectedSymbolGraph(SymbolGraph, DirectedGraph):
    """
    This implements a symple directed symbol graph, whose nodes are symbols instead of int numbers.
    """


def test():
    # test for graphs
    g = Graph(4)
    g.add_edge(0, 1)
    assert not g.has_circle()

    g = Graph(4)
    g.add_edge(0, 1)
    g.add_edge(1, 2)
    g.add_edge(3, 2)
    g.add_edge(3, 0)
    assert g.has_circle()

    dg = DirectedGraph(4)
    dg.add_edge(0, 1)
    dg.add_edge(1, 0)
    assert dg.has_circle()

    dg = DirectedGraph(4)
    dg.add_edge(0, 1)
    dg.add_edge(1, 2)
    dg.add_edge(3, 2)
    dg.add_edge(3, 0)
    assert not dg.has_circle()

    g = Graph(4)
    g.add_edge(0, 1)
    g.add_edge(1, 2)
    g.add_edge(3, 2)
    assert g.topology_order() == [3, 2, 1, 0]

    dg = DirectedGraph(4)
    dg.add_edge(0, 1)
    dg.add_edge(1, 2)
    dg.add_edge(3, 2)
    assert dg.topology_order() == [2, 1, 0, 3]

    # test for symbol graphs
    sg = SymbolGraph(4)
    sg.add_edge("A", "B")
    assert not sg.has_circle()

    sg = SymbolGraph(4)
    sg.add_edge("0", "1")
    sg.add_edge("1", "2")
    sg.add_edge("3", "2")
    sg.add_edge("3", "0")
    assert sg.has_circle()

    dsg = DirectedSymbolGraph(4)
    dsg.add_edge("0", "1")
    dsg.add_edge("1", "0")
    assert dsg.has_circle()

    dsg = DirectedSymbolGraph(4)
    dsg.add_edge("0", "1")
    dsg.add_edge("1", "2")
    dsg.add_edge("3", "2")
    dsg.add_edge("3", "0")
    assert not dsg.has_circle()

    sg = SymbolGraph(4)
    sg.add_edge("0", "1")
    sg.add_edge("1", "2")
    sg.add_edge("3", "2")
    assert sg.topology_order() == ["3", "2", "1", "0"]

    dsg = DirectedSymbolGraph(4)
    dsg.add_edge("0", "1")
    dsg.add_edge("1", "2")
    dsg.add_edge("3", "2")
    assert dsg.topology_order() == ["2", "1", "0", "3"]


def test2():
    from deepdataspace.process.processor import ProcessorMeta
    print(ProcessorMeta.processors)


if __name__ == "__main__":
    test2()
