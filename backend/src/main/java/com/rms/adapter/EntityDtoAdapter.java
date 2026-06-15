package com.rms.adapter;

/**
 * Adapter Pattern: Interface for converting between Entity and DTO
 * @param <E> Entity type
 * @param <D> DTO type
 */
public interface EntityDtoAdapter<E, D> {
    
    /**
     * Convert Entity to DTO (Response)
     */
    D toDto(E entity);
    
    /**
     * Convert DTO (Request) to Entity
     */
    E toEntity(D dto);
}
