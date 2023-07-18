
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { FixedSizeList as List } from "react-window";
import TreeView from "@material-ui/lab/TreeView";
import TreeItem from "@material-ui/lab/TreeItem";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import HeightIcon from "@material-ui/icons/Height";
import VerticalAlignCenterIcon from "@material-ui/icons/VerticalAlignCenter";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";

const useStyles = makeStyles({
  list: {
    height: "100%",
    overflow: "auto",
  },
});



const MemoizedTreeView = React.memo(TreeView);
const MemoizedTreeItem = React.memo(TreeItem);

const TreeComponent = ({ data }) => {
  const classes = useStyles();
  const [expandedNodes, setExpandedNodes] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [stopIndex, setStopIndex] = useState(10);

  const loadChildren = (nodeId, data) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const children = data.filter((item) => item.parentId === nodeId);
        resolve(children);
      }, 100);
    });
  };

  const buildTree = useCallback(
    async (items, parentId = null, parentExpanded = true) => {
      const nodes = items.filter((item) => item.parentId === parentId);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.loading = true;

        if (!node.children) {
          try {
            const children = await loadChildren(node.id, data);
            node.children = children;
          } catch (error) {
            console.error("Error loading children:", error);
          } finally {
            node.loading = false;
          }
        }

        const isNodeExpanded =
          parentExpanded && expandedNodes.includes(node.id);

        if (isNodeExpanded) {
          await buildTree(node.children, node.id, isNodeExpanded);
        }
      }

      return nodes;
    },
    [data, expandedNodes]
  );

  useEffect(() => {
    const populateTreeData = async () => {
      const initialTreeData = await buildTree(data);
      setTreeData(initialTreeData);
    };

    populateTreeData();
  }, [buildTree, data]);

  const renderTree = useCallback(
    (nodes, parentExpanded = true) => (
      <MemoizedTreeView
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expandedNodes}
        onNodeToggle={(event, nodeIds) => setExpandedNodes(nodeIds)}
      >
        {nodes.map((node) => {
          const { id, label, children, loading } = node;

          const isNodeExpanded = parentExpanded && expandedNodes.includes(id);

          return (
            <MemoizedTreeItem
              key={id}
              nodeId={id}
              label={label}
              onLabelClick={() =>
                !loading &&
                setExpandedNodes((prevState) => [...prevState, node.id])
              }
            >
              {children && children.length > 0 ? (
                renderTree(children, isNodeExpanded)
              ) : loading ? (
                <div>Loading...</div>
              ) : null}
            </MemoizedTreeItem>
          );
        })}
      </MemoizedTreeView>
    ),
    [expandedNodes]
  );

  const expandAllNodes = useCallback(() => {
    const allNodeIds = [];

    const traverseTree = (nodes) => {
      nodes.forEach((node) => {
        allNodeIds.push(node.id);

        if (node.children && node.children.length > 0) {
          traverseTree(node.children);
        }
      });
    };

    traverseTree(treeData);
    setExpandedNodes([...expandedNodes, ...allNodeIds]);
  }, [treeData, expandedNodes]);

  const collapseAllNodes = useCallback(() => {
    setExpandedNodes([]);
  }, []);

  // const itemSizes = useMemo(() => {
  //   const sizes = treeData.map(() => 20);
  //   return sizes;
  // }, [treeData]);

  const rowRenderer = ({ index, style }) => {
    const item = treeData[index];

    return (
      
       <div  style={style}>
        
        <MemoizedTreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          expanded={expandedNodes}
          onNodeToggle={(event, nodeIds) => setExpandedNodes(nodeIds)}
        >
          {renderTree([item])}
        </MemoizedTreeView>
        
      </div>
    );
  };


  
  

  const handleScroll = useCallback(({ scrollDirection, scrollOffset, scrollUpdateWasRequested }) => {
    if (!isLoadingMore && scrollDirection === "forward" && scrollUpdateWasRequested) {
      const listRef = listRef.current;
      const visibleStartIndex = listRef.visibleRowStartIndex;
      const visibleStopIndex = listRef.visibleRowStopIndex;

      // Adjust the condition and logic to load more items based on your requirements
      if (visibleStopIndex === treeData.length - 1) {
        setIsLoadingMore(true);
        setStartIndex(visibleStartIndex);
        setStopIndex(visibleStopIndex + 10);
      }
    }
  }, [isLoadingMore, treeData]);

  const handleLoadMore = useCallback(async () => {
    try {
      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Implement your logic to fetch more items from the server or any other data source
      // Adjust the code below according to your specific needs

      // Example implementation with a mock API request
      const response = await fetch(`your-api-endpoint?startIndex=${startIndex}&stopIndex=${stopIndex}`);
      const newData = await response.json();

      setTreeData((prevTreeData) => [...prevTreeData, ...newData]);
    } catch (error) {
      console.error("Error loading more items:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [startIndex, stopIndex]);

  useEffect(() => {
    if (isLoadingMore) {
      handleLoadMore();
    }
  }, [isLoadingMore, handleLoadMore]);

  const listRef = useRef(null);

  return (
    <div>
      <Tooltip title="Expand All">
        <IconButton onClick={expandAllNodes}>
          <HeightIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Collapse All">
        <IconButton onClick={collapseAllNodes}>
          <VerticalAlignCenterIcon />
        </IconButton>
      </Tooltip>

      <List
        className={classes.list}
        
        height={400}
        itemCount={treeData.length}
        //itemSize={(index) => itemSizes[index]}
        itemSize={20}
        onScroll={handleScroll}
        ref={listRef}
        width="100%"
      >
        {rowRenderer}
      </List>
    </div>


    
     
    
  );
};

export default TreeComponent;














