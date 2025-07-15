import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { handleError } from '../utils/errorHandler';

// Hook pour les requêtes Firestore avec pagination
export const useFirestoreQuery = (collectionName, constraints = [], options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const { 
    pageSize = 10, 
    realtime = false, 
    orderByField = 'createdAt', 
    orderDirection = 'desc' 
  } = options;

  const fetchData = async (isLoadMore = false) => {
    try {
      setLoading(true);
      
      let q = query(
        collection(db, collectionName),
        ...constraints,
        orderBy(orderByField, orderDirection),
        limit(pageSize)
      );

      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const newData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (isLoadMore) {
        setData(prev => [...prev, ...newData]);
      } else {
        setData(newData);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === pageSize);
      setError(null);
    } catch (err) {
      setError(handleError(err, `Firestore Query: ${collectionName}`));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchData(true);
    }
  };

  const refresh = () => {
    setLastDoc(null);
    setHasMore(true);
    fetchData(false);
  };

  useEffect(() => {
    if (realtime) {
      let q = query(
        collection(db, collectionName),
        ...constraints,
        orderBy(orderByField, orderDirection)
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const newData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setData(newData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          setError(handleError(err, `Firestore Realtime: ${collectionName}`));
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      fetchData();
    }
  }, [collectionName, JSON.stringify(constraints), realtime]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};

// Hook pour récupérer un document unique
export const useFirestoreDoc = (collectionName, docId, realtime = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, docId);

    if (realtime) {
      const unsubscribe = onSnapshot(docRef,
        (doc) => {
          if (doc.exists()) {
            setData({ id: doc.id, ...doc.data() });
          } else {
            setData(null);
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          setError(handleError(err, `Firestore Doc: ${collectionName}/${docId}`));
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      const fetchDoc = async () => {
        try {
          const doc = await getDoc(docRef);
          if (doc.exists()) {
            setData({ id: doc.id, ...doc.data() });
          } else {
            setData(null);
          }
          setError(null);
        } catch (err) {
          setError(handleError(err, `Firestore Doc: ${collectionName}/${docId}`));
        } finally {
          setLoading(false);
        }
      };

      fetchDoc();
    }
  }, [collectionName, docId, realtime]);

  return { data, loading, error };
};