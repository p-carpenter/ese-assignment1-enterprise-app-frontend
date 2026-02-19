import { describe, it, expect, vi, beforeEach, type MockedObject, type MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { SongUploadForm } from '../components/SongForm';
import { SongLibrary } from '../components/SongLibrary';
import { api } from '../services/api';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import type { Song } from '../types';

vi.mock('../services/api', () => ({
    api: {
        songs: {
            upload: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('../hooks/useCloudinaryUpload', () => ({
    useCloudinaryUpload: vi.fn(),
}));

// Cast mocks
const mockedApi = api as MockedObject<typeof api>;
const mockedUseCloudinary = useCloudinaryUpload as MockedFunction<typeof useCloudinaryUpload>;

const mockSongs: Song[] = [
    { id: 1, title: 'Song A', artist: 'Artist 1', duration: 120, file_url: 'http://example.com/song1.mp3', cover_art_url: 'http://example.com/cover1.jpg' },
    { id: 2, title: 'Song B', artist: 'Artist 2', duration: 150, file_url: 'http://example.com/song2.mp3', cover_art_url: 'http://example.com/cover2.jpg' },
];

describe('Song Management', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        mockedUseCloudinary.mockReturnValue({
            upload: vi.fn().mockResolvedValue({ secure_url: 'http://audio.url/song.mp3', duration: 123 }),
            isUploading: false,
            error: null,
        });
    });

    //Create / Upload Test
    it('uploads a song and calls onUploadSuccess', async () => {
        const onUploadSuccess = vi.fn();
        (mockedApi.songs.upload as any).mockResolvedValueOnce({
            id: 1,
            title: 'Test Song',
            artist: 'Test Artist',
            file_url: 'http://audio.url/song.mp3',
            duration: 123,
        });
        
        render(<SongUploadForm onUploadSuccess={onUploadSuccess} />);

        fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Test Song' } });
        fireEvent.change(screen.getByPlaceholderText('Artist'), { target: { value: 'Test Artist' } });

        const file = new File(['dummy'], 'test.mp3', { type: 'audio/mp3' });
        const audioInput = screen.getByLabelText(/Select MP3/i);
        fireEvent.change(audioInput, { target: { files: [file] } });

        expect(await screen.findByText('✓ Audio file ready')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Save Song/i }));

        await waitFor(() => {
            expect(mockedApi.songs.upload).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Test Song',
                artist: 'Test Artist',
            }));
            expect(onUploadSuccess).toHaveBeenCalled();
        });
    });

    // Read / Render Test
    it('renders the list of songs correctly', () => {
        const onSongClick = vi.fn();
        render(<SongLibrary songs={mockSongs} onSongClick={onSongClick} />);
        
        expect(screen.getByText('Song A')).toBeInTheDocument();
        expect(screen.getByText('Song B')).toBeInTheDocument();
        expect(screen.getByText('Artist 1')).toBeInTheDocument();
    });

    // Delete Test
    it('calls api.songs.delete when Delete is clicked', async () => {
        (mockedApi.songs.delete as any).mockResolvedValueOnce({});
        const onSongClick = vi.fn();
        
        render(<SongLibrary songs={mockSongs} onSongClick={onSongClick} />);

        const moreButtons = screen.getAllByRole('button');
        fireEvent.click(moreButtons[0]);

        const deleteOption = await screen.findByText('Delete');
        fireEvent.click(deleteOption);

        await waitFor(() => {
            expect(mockedApi.songs.delete).toHaveBeenCalledWith(mockSongs[0].id);
        });
    });
});